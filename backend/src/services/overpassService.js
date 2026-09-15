const axios = require('axios');
const mongoose = require('mongoose');
const { Country } = require('country-state-city');
const Hospital = require('../models/Hospital');

// In-memory cache for Nominatim + Overpass results (TTL: 20 minutes)
const searchCache = new Map();
const CACHE_TTL_MS = 20 * 60 * 1000;

/**
 * Calculate distance between two lat/lng points in KM using Haversine formula
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Geocode location string using OpenStreetMap Nominatim API
 */
async function geocodeLocation(queryStr) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SmartQueue-Health-Tracker/1.0 (contact@smartqueuehealth.org)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 6000,
    });

    if (response.data && response.data.length > 0) {
      const item = response.data[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
      };
    }
  } catch (err) {
    console.warn(`[Geocoding] Nominatim lookup failed for "${queryStr}":`, err.message);
  }
  return null;
}

/**
 * Query Overpass API for hospitals/clinics/doctors within radiusMeters (default 15km)
 */
async function fetchOverpassHospitals(lat, lng, radiusMeters = 15000) {
  const overpassQuery = `[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  node["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
  way["amenity"="doctors"](around:${radiusMeters},${lat},${lng});
  node["healthcare"](around:${radiusMeters},${lat},${lng});
  way["healthcare"](around:${radiusMeters},${lat},${lng});
);
out center 50;`;

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const mirrorUrl of mirrors) {
    try {
      const response = await axios.post(
        mirrorUrl,
        `data=${encodeURIComponent(overpassQuery)}`,
        {
          headers: {
            'User-Agent': 'SmartQueue-Health-Tracker/1.0 (contact@smartqueuehealth.org)',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 7000,
        }
      );

      if (response.data && response.data.elements && response.data.elements.length > 0) {
        return response.data.elements;
      }
    } catch (err) {
      console.warn(`[Overpass API] Mirror ${mirrorUrl} failed/timed out:`, err.message);
    }
  }
  return [];
}

/**
 * Classify hospital category: Government, Clinic, or Private
 */
function classifyHospitalType(elem) {
  const tags = elem.tags || {};
  const name = (tags.name || tags['name:en'] || tags['official_name'] || '').toLowerCase();
  const operatorType = (tags['operator:type'] || '').toLowerCase();
  const operator = (tags['operator'] || '').toLowerCase();
  const amenity = (tags['amenity'] || tags['healthcare'] || '').toLowerCase();

  if (amenity === 'clinic' || amenity === 'doctors' || tags['healthcare'] === 'clinic' || tags['healthcare'] === 'doctor') {
    return 'Clinic';
  }

  const isGovt =
    operatorType.includes('gov') ||
    operatorType.includes('public') ||
    operator.includes('gov') ||
    operator.includes('public') ||
    operator.includes('department of health') ||
    operator.includes('ministry of health') ||
    /\b(govt|government|district hospital|general hospital|gh|public hospital|medical college hospital)\b/i.test(name);

  if (isGovt) {
    return 'Government';
  }

  return 'Private';
}

/**
 * Parse full address string from OSM tags
 */
function parseFullAddress(tags, district, state, fallbackDisplayName) {
  if (tags['addr:full']) return tags['addr:full'];

  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighborhood'],
    tags['addr:city'] || tags['addr:district'] || district,
    tags['addr:state'] || state,
    tags['addr:postcode'],
  ].filter(Boolean);

  if (parts.length >= 2) {
    return parts.join(', ');
  }

  if (fallbackDisplayName) {
    return fallbackDisplayName.split(', ').slice(0, 3).join(', ');
  }

  return 'Not available';
}

/**
 * Helper to normalize name for deduplication
 */
function normalizeName(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/(hospital|clinic|center|centre|healthcare|nursinghome|gh)/g, '');
}

/**
 * Main service method: Search hospitals by location params
 */
async function searchHospitalsByLocation(queryParams) {
  const { country, state, district, area, radius, search, crowdStatus } = queryParams;
  const radiusMeters = parseInt(radius, 10) || 15000; // 15km radius

  let cleanCountry = (country && country !== 'All') ? country.trim() : '';
  const cleanState = (state && state !== 'All') ? state.trim() : '';
  const cleanDistrict = (district && district !== 'All' && district !== 'All Districts') ? district.trim() : '';
  const cleanArea = (area && area !== 'All') ? area.trim() : '';

  // Resolve 2-letter country ISO code to full country name if applicable
  if (cleanCountry && cleanCountry.length === 2) {
    try {
      const cObj = Country.getCountryByCode(cleanCountry.toUpperCase());
      if (cObj && cObj.name) {
        cleanCountry = cObj.name;
      }
    } catch (err) {
      console.warn('[Overpass Service] Country ISO lookup warning:', err.message);
    }
  }

  const cacheKey = `${cleanCountry}_${cleanState}_${cleanDistrict}_${cleanArea}_r${radiusMeters}`;

  // 1. Check 20-minute cache
  let cachedData = null;
  const cachedEntry = searchCache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    cachedData = cachedEntry.data;
  }

  let resultsList = [];

  if (cachedData) {
    resultsList = cachedData;
  } else {
    // 2. Build geocoding search strings (try specific area first, fallback to district+state+country)
    const primaryQuery = [cleanArea, cleanDistrict, cleanState, cleanCountry].filter(Boolean).join(', ');
    const fallbackQuery = [cleanDistrict, cleanState, cleanCountry].filter(Boolean).join(', ');
    const simpleDistrictQuery = [cleanDistrict, cleanCountry].filter(Boolean).join(', ');

    let geo = null;
    if (primaryQuery) {
      geo = await geocodeLocation(primaryQuery);
    }
    if (!geo && fallbackQuery && fallbackQuery !== primaryQuery) {
      geo = await geocodeLocation(fallbackQuery);
    }
    if (!geo && simpleDistrictQuery && simpleDistrictQuery !== fallbackQuery) {
      geo = await geocodeLocation(simpleDistrictQuery);
    }

    let osmResults = [];
    if (geo) {
      try {
        const rawElements = await fetchOverpassHospitals(geo.lat, geo.lng, radiusMeters);

        osmResults = rawElements
          .map((elem, idx) => {
            const tags = elem.tags || {};
            const hName = tags.name || tags['name:en'] || tags['official_name'] || null;
            if (!hName) return null;

            const hLat = elem.lat || (elem.center && elem.center.lat) || geo.lat;
            const hLng = elem.lon || (elem.center && elem.center.lon) || geo.lng;
            const distanceKm = calculateHaversineDistance(geo.lat, geo.lng, hLat, hLng);

            const category = classifyHospitalType(elem);
            const address = parseFullAddress(tags, cleanDistrict, cleanState, geo.displayName);
            const phone = tags['contact:phone'] || tags['phone'] || tags['phone:mobile'] || 'Not available';
            const emergency = tags['amenity'] === 'hospital' || tags['emergency'] === 'yes' || category === 'Government';

            // Deterministic queue metrics simulation based on element ID
            const numericId = elem.id || (idx + 100);
            const queueLen = (numericId % 38) + 2; // 2 to 40
            const avgWait = Math.max(5, Math.min(60, Math.round(queueLen * 1.4 + (numericId % 7))));

            let crowd = 'Low';
            if (queueLen > 25) crowd = 'Critical';
            else if (queueLen > 15) crowd = 'High';
            else if (queueLen > 8) crowd = 'Moderate';

            const hexId = String(numericId).padStart(24, '0').slice(-24);

            return {
              _id: hexId,
              name: hName,
              code: `${category === 'Government' ? 'GOVT' : category === 'Clinic' ? 'CLIN' : 'PRIV'}-${numericId}`,
              category,
              district: cleanDistrict || tags['addr:city'] || 'Central District',
              state: cleanState || 'Region',
              area: cleanArea || tags['addr:suburb'] || '',
              address,
              phone,
              rating: 'Not available',
              currentQueueLength: queueLen,
              avgWaitTimeMinutes: avgWait,
              crowdStatus: crowd,
              emergencyServices: emergency,
              departments: ['General Medicine', 'Outpatient OPD'],
              operatingHours: tags['opening_hours'] || (category === 'Clinic' ? '09:00 AM - 07:00 PM' : '24/7 Open'),
              distanceKm,
              lat: hLat,
              lng: hLng,
              source: 'osm',
            };
          })
          .filter(Boolean);
      } catch (err) {
        console.warn('[Overpass Service] Error processing Overpass results:', err.message);
      }
    }

    // 3. Query seeded MongoDB Hospital collection for same district/state
    let mongoDbHospitals = [];
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbQuery = {};
        if (cleanDistrict) {
          dbQuery.district = new RegExp(cleanDistrict, 'i');
        }
        if (cleanState) {
          dbQuery.state = new RegExp(cleanState, 'i');
        }

        mongoDbHospitals = await Hospital.find(dbQuery).lean();
      } catch (err) {
        console.warn('[Overpass Service] MongoDB query error:', err.message);
      }
    }

    // 4. Merge MongoDB results (prioritized first) with OSM results
    const combined = [];
    const seenNames = new Set();

    // Add MongoDB seeded records first (they take priority)
    for (const mHosp of mongoDbHospitals) {
      const normKey = normalizeName(mHosp.name);
      if (normKey) {
        seenNames.add(normKey);
      }
      combined.push({
        ...mHosp,
        rating: mHosp.rating || 'Not available',
        phone: mHosp.phone || 'Not available',
        address: mHosp.address || 'Not available',
        distanceKm: geo && mHosp.coordinates ? calculateHaversineDistance(geo.lat, geo.lng, mHosp.coordinates.lat, mHosp.coordinates.lng) : 0,
        source: 'mongodb',
      });
    }

    // Add OSM results if not already present
    for (const osmHosp of osmResults) {
      const normKey = normalizeName(osmHosp.name);
      let isDuplicate = false;

      if (seenNames.has(normKey)) {
        isDuplicate = true;
      } else {
        // Check partial string matching
        for (const existingKey of seenNames) {
          if (existingKey.length > 5 && normKey.length > 5 && (existingKey.includes(normKey) || normKey.includes(existingKey))) {
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        seenNames.add(normKey);
        combined.push(osmHosp);
      }
    }

    // If both Nominatim/Overpass and DB returned no records (e.g. invalid location), fallback to all seeded DB hospitals
    if (combined.length === 0 && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const allDb = await Hospital.find({}).lean();
        for (const h of allDb) {
          combined.push({
            ...h,
            rating: h.rating || 'Not available',
            phone: h.phone || 'Not available',
            address: h.address || 'Not available',
            source: 'mongodb_fallback',
          });
        }
      } catch (fErr) {
        console.warn('[Overpass Service] General fallback query failed:', fErr.message);
      }
    }

    // Sort by distanceKm ascending
    combined.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    resultsList = combined;

    // Cache results for 20 minutes if we got data
    if (resultsList.length > 0) {
      searchCache.set(cacheKey, { timestamp: Date.now(), data: resultsList });
    }
  }

  // 5. Apply client-side filters (search query text & crowdStatus)
  let finalResults = resultsList;

  if (search && search.trim() !== '') {
    const sRegex = new RegExp(search.trim(), 'i');
    finalResults = finalResults.filter(
      (h) =>
        sRegex.test(h.name) ||
        sRegex.test(h.address || '') ||
        sRegex.test(h.category || '') ||
        sRegex.test(h.district || '')
    );
  }

  if (crowdStatus && crowdStatus !== 'All') {
    finalResults = finalResults.filter((h) => h.crowdStatus === crowdStatus);
  }

  return finalResults;
}

module.exports = {
  searchHospitalsByLocation,
  geocodeLocation,
  fetchOverpassHospitals,
};
