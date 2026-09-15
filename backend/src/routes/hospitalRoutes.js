const express = require('express');
const axios = require('axios');
const Hospital = require('../models/Hospital');
const { searchHospitalsByLocation } = require('../services/overpassService');

const router = express.Router();

// In-memory cache for geocoding & hospital search results (TTL: 20 minutes)
const nearbyCache = new Map();
const CACHE_TTL_MS = 20 * 60 * 1000;

// In-memory cache for Google Place Details (TTL: 6 Hours)
const detailsCache = new Map();
const DETAILS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * @route   GET /api/hospitals/photo
 * @desc    Secure proxy for Google Places Photo API (keeps API key server-side)
 * @access  Public
 */
router.get('/photo', async (req, res) => {
  try {
    const { ref, maxwidth } = req.query;
    if (!ref) {
      return res.status(400).json({ success: false, message: 'Photo reference string is required.' });
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY || process.env.VITE_GOOGLE_PLACES_KEY;
    if (!apiKey || apiKey.includes('YOUR_GOOGLE_PLACES_API_KEY')) {
      return res.status(503).json({ success: false, message: 'Google Places API key is not configured.' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth || 600}&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`;

    const response = await axios({
      method: 'get',
      url: photoUrl,
      responseType: 'stream',
      timeout: 10000,
    });

    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache browser images for 24h
    response.data.pipe(res);
  } catch (err) {
    console.warn('[Photo Proxy] Error fetching photo:', err.message);
    return res.status(404).json({ success: false, message: 'Photo unavailable.' });
  }
});

/**
 * @route   GET /api/hospitals/details/:placeId
 * @desc    Secure 6-hour cached proxy for Google Places Place Details API
 * @access  Public
 */
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      return res.status(400).json({ success: false, message: 'Place ID is required.' });
    }

    // 1. Check 6-Hour In-Memory Cache
    const cached = detailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL_MS) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: cached.data,
      });
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY || process.env.VITE_GOOGLE_PLACES_KEY;
    if (!apiKey || apiKey.includes('YOUR_GOOGLE_PLACES_API_KEY')) {
      return res.status(200).json({
        success: true,
        source: 'fallback',
        data: {
          place_id: placeId,
          name: 'Hospital Facility',
          formatted_address: 'Not available',
          formatted_phone_number: 'Not available',
          website: null,
          rating: 'Not available',
          user_ratings_total: 0,
          opening_hours: 'Not available',
          reviews: [],
          photos: [],
          business_status: 'OPERATIONAL',
        },
      });
    }

    // 2. Fetch Place Details from Google Places REST API
    const fields = 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,opening_hours,photos,types,business_status,geometry';
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;

    const googleRes = await axios.get(googleUrl, { timeout: 10000 });

    if (googleRes.data && googleRes.data.status === 'OK' && googleRes.data.result) {
      const p = googleRes.data.result;

      const mappedPhotos = (p.photos || []).slice(0, 5).map((photo) => ({
        photo_reference: photo.photo_reference,
        proxy_url: `/api/hospitals/photo?ref=${encodeURIComponent(photo.photo_reference)}&maxwidth=600`,
      }));

      const mappedReviews = (p.reviews || []).slice(0, 3).map((r) => ({
        author_name: r.author_name || 'Anonymous Reviewer',
        rating: r.rating || 5,
        text: r.text || '',
        relative_time_description: r.relative_time_description || 'Recently',
        profile_photo_url: r.profile_photo_url || null,
      }));

      const cleanDetails = {
        place_id: placeId,
        name: p.name || 'Hospital Facility',
        formatted_address: p.formatted_address || 'Not available',
        formatted_phone_number: p.formatted_phone_number || 'Not available',
        website: p.website || null,
        rating: p.rating ? parseFloat(p.rating.toFixed(1)) : 'Not available',
        user_ratings_total: p.user_ratings_total || 0,
        opening_hours: p.opening_hours
          ? p.opening_hours.weekday_text
            ? p.opening_hours.weekday_text.join(' • ')
            : p.opening_hours.open_now
            ? 'Open Now'
            : 'Closed'
          : 'Not available',
        open_now: p.opening_hours ? p.opening_hours.open_now : null,
        reviews: mappedReviews,
        photos: mappedPhotos,
        business_status: p.business_status || 'OPERATIONAL',
        types: p.types || [],
        geometry: p.geometry || null,
      };

      // Store in 6-hour cache
      detailsCache.set(placeId, { timestamp: Date.now(), data: cleanDetails });

      return res.status(200).json({
        success: true,
        source: 'google',
        data: cleanDetails,
      });
    }

    return res.status(200).json({
      success: true,
      source: 'not_found',
      data: {
        place_id: placeId,
        name: 'Hospital Facility',
        formatted_address: 'Not available',
        formatted_phone_number: 'Not available',
        website: null,
        rating: 'Not available',
        user_ratings_total: 0,
        opening_hours: 'Not available',
        reviews: [],
        photos: [],
        business_status: 'OPERATIONAL',
      },
    });
  } catch (err) {
    console.error(`Error fetching Place Details for ${req.params.placeId}:`, err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital details.',
    });
  }
});




/**
 * @route   GET /api/hospitals/search
 * @desc    Fetch REAL live hospitals/clinics via OpenStreetMap Nominatim Geocoding + Overpass API
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const results = await searchHospitalsByLocation(req.query);

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error in /hospitals/search:', error);
    // Never return a raw error to frontend — fallback cleanly to seeded DB records
    try {
      const fallbackRecords = await Hospital.find({}).lean();
      return res.status(200).json({
        success: true,
        count: fallbackRecords.length,
        data: fallbackRecords,
        message: 'Fallback to default hospital database.',
      });
    } catch (fallbackErr) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  }
});

/**
 * @route   GET /api/hospitals
 * @desc    Get list of hospitals with optional filters (district, search, crowdStatus, department)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { state, district, area, search, crowdStatus, department } = req.query;

    const query = {};

    // Filter by State (case-insensitive)
    if (state && state !== 'All' && state.trim() !== '') {
      query.state = new RegExp(`^${state.trim()}$`, 'i');
    }

    // Filter by District (case-insensitive)
    if (district && district !== 'All' && district.trim() !== '') {
      query.district = new RegExp(`^${district.trim()}$`, 'i');
    }

    // Filter by Area (case-insensitive)
    if (area && area !== 'All' && area.trim() !== '') {
      query.area = new RegExp(`^${area.trim()}$`, 'i');
    }

    // Filter by crowdStatus if provided (and not 'All')
    if (crowdStatus && crowdStatus !== 'All' && crowdStatus.trim() !== '') {
      query.crowdStatus = crowdStatus;
    }

    // Filter by specific department if provided
    if (department && department.trim() !== '') {
      query.departments = { $in: [new RegExp(department, 'i')] };
    }

    // Search query matching name, code, address, district, state, area or department
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { address: searchRegex },
        { state: searchRegex },
        { district: searchRegex },
        { area: searchRegex },
        { departments: searchRegex },
      ];
    }

    const hospitals = await Hospital.find(query).sort({ rating: -1, currentQueueLength: 1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospitals list.',
    });
  }
});

/**
 * @route   GET /api/hospitals/districts/list
 * @desc    Get list of unique hospital districts for filter options
 * @access  Public
 */
router.get('/districts/list', async (req, res) => {
  try {
    const districts = await Hospital.distinct('district');
    return res.status(200).json({
      success: true,
      data: ['All Districts', ...districts],
    });
  } catch (error) {
    console.error('Error fetching hospital districts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital districts.',
    });
  }
});

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get hospital details by Mongo ID or Hospital Code
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let hospital;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      hospital = await Hospital.findById(id);
    } else {
      hospital = await Hospital.findOne({ code: id.toUpperCase() });
    }

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital record not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error('Error fetching hospital details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching hospital details.',
    });
  }
});

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Update hospital details and live metrics (Staff/Admin)
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const hospital = await Hospital.findByIdAndUpdate(id, updateData, { new: true });
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hospital details updated successfully.',
      data: hospital,
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating hospital metrics.',
    });
  }
});

module.exports = router;
