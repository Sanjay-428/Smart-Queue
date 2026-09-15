import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Star,
  Clock,
  Phone,
  Globe,
  ExternalLink,
  Users,
  ShieldCheck,
  AlertCircle,
  Car,
  ChevronRight,
  RefreshCw,
  Info,
  Building2,
  CheckCircle2,
  Key
} from 'lucide-react';
import api from '../api/axios';

/**
 * Custom hook to load Google Maps JavaScript API script dynamically
 */
function useGoogleMapsScript(apiKey) {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY') {
      setLoadError('API_KEY_MISSING');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => setLoaded(true));
      existingScript.addEventListener('error', () => setLoadError('SCRIPT_LOAD_FAILED'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoadError('SCRIPT_LOAD_FAILED');
    document.head.appendChild(script);
  }, [apiKey]);

  return { loaded, loadError };
}

export default function GooglePlacesLocator({ onSelectHospital, onJoinQueue }) {
  // API Key state
  const envApiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
  const [userApiKey, setUserApiKey] = useState(
    envApiKey && envApiKey !== 'YOUR_GOOGLE_PLACES_API_KEY' ? envApiKey : ''
  );
  const [inputKey, setInputKey] = useState('');

  const activeKey = userApiKey || (envApiKey !== 'YOUR_GOOGLE_PLACES_API_KEY' ? envApiKey : '');
  const { loaded: mapsLoaded, loadError } = useGoogleMapsScript(activeKey);

  // User location state (lat/lng)
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('Detecting your position...');
  const [locationError, setLocationError] = useState(null);

  // Search & Filters
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);

  // Hospitals Data from Places API
  const [hospitals, setHospitals] = useState([]);
  const [hospitalQueues, setHospitalQueues] = useState({}); // place_id -> queue object or null
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Map & Autocomplete Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const markersRef = useRef({});
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const watchIdRef = useRef(null);

  // -------------------------------------------------------------
  // 1. Continuous Live Geolocation Tracking (watchPosition)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
      return;
    }

    const handleSuccess = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const newPos = { lat, lng };

      setUserLocation(newPos);
      setLocationError(null);

      // Reverse geocode to human address if Google Maps is loaded
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setLocationAddress(results[0].formatted_address);
          } else {
            setLocationAddress(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
          }
        });
      } else {
        setLocationAddress(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      }
    };

    const handleError = (err) => {
      console.warn('Geolocation error:', err.message);
      setLocationError('Location permission denied or unavailable. Showing default area.');
      if (!userLocation) {
        setUserLocation({ lat: 13.0827, lng: 80.2707 });
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 2. Fetch Backend Queue Status per Google Place ID
  // -------------------------------------------------------------
  const fetchQueueForPlace = useCallback(async (placeId) => {
    try {
      const response = await api.get(`/queue/place/${placeId}`);
      if (response.data && response.data.available) {
        return response.data.data;
      }
    } catch (err) {
      console.warn(`[Queue Lookup] Error for place ${placeId}:`, err.message);
    }
    return null;
  }, []);

  // -------------------------------------------------------------
  // 3. Distance Matrix API Calculation
  // -------------------------------------------------------------
  const computeDistancesAndDurations = useCallback((origin, destinationHospitals) => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps || destinationHospitals.length === 0) {
        resolve(destinationHospitals);
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();
      const destinations = destinationHospitals.map((h) => h.geometry.location);

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: destinations,
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status === 'OK' && response.rows[0]) {
            const results = response.rows[0].elements;
            const updated = destinationHospitals.map((h, i) => {
              const res = results[i];
              if (res && res.status === 'OK') {
                return {
                  ...h,
                  distanceText: res.distance.text,
                  distanceValue: res.distance.value,
                  durationText: res.duration.text,
                };
              }
              return {
                ...h,
                distanceText: 'Not available',
                distanceValue: 999999,
                durationText: 'Not available',
              };
            });

            // Sort nearest first
            updated.sort((a, b) => a.distanceValue - b.distanceValue);
            resolve(updated);
          } else {
            console.warn('Distance Matrix failed:', status);
            resolve(destinationHospitals);
          }
        }
      );
    });
  }, []);

  // -------------------------------------------------------------
  // 4. Perform Google Places Nearby Search (type=hospital)
  // -------------------------------------------------------------
  const performNearbySearch = useCallback(
    async (centerLocation) => {
      if (!window.google || !window.google.maps || !window.google.maps.places) return;
      if (!centerLocation) return;

      setLoading(true);
      setStatusMessage('Fetching real verified hospitals from Google Places API...');

      const tempDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(
        mapInstanceRef.current || tempDiv
      );

      const request = {
        location: new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
        radius: radiusKm * 1000,
        type: ['hospital'],
      };

      service.nearbySearch(request, async (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setStatusMessage(`Found ${results.length} real hospitals nearby. Fetching details & live distance...`);

          // Fetch full place details for each hospital
          const detailedHospitals = await Promise.all(
            results.slice(0, 15).map((place) => {
              return new Promise((resolve) => {
                service.getDetails(
                  {
                    placeId: place.place_id,
                    fields: [
                      'place_id',
                      'name',
                      'formatted_address',
                      'formatted_phone_number',
                      'website',
                      'rating',
                      'user_ratings_total',
                      'opening_hours',
                      'photos',
                      'reviews',
                      'geometry',
                      'business_status',
                      'types',
                    ],
                  },
                  (detail, detailStatus) => {
                    if (
                      detailStatus === window.google.maps.places.PlacesServiceStatus.OK &&
                      detail
                    ) {
                      resolve(detail);
                    } else {
                      resolve(place);
                    }
                  }
                );
              });
            })
          );

          // Compute real driving distances via Distance Matrix
          const sortedHospitals = await computeDistancesAndDurations(
            centerLocation,
            detailedHospitals
          );

          setHospitals(sortedHospitals);

          // Fetch backend queue records in parallel
          const queueMap = {};
          await Promise.all(
            sortedHospitals.map(async (h) => {
              if (h.place_id) {
                const qData = await fetchQueueForPlace(h.place_id);
                queueMap[h.place_id] = qData;
              }
            })
          );
          setHospitalQueues(queueMap);

          setStatusMessage('');
        } else {
          setHospitals([]);
          setStatusMessage('No verified hospital records found in this radius.');
        }
        setLoading(false);
      });
    },
    [radiusKm, computeDistancesAndDurations, fetchQueueForPlace]
  );

  // -------------------------------------------------------------
  // 5. Initialize Google Map & Autocomplete
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapsLoaded || !userLocation || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: userLocation,
        zoom: 13,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
          { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
          { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] },
        ],
        disableDefaultUI: false,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
    }

    // Update / Create Live User Location Marker
    if (mapInstanceRef.current) {
      const userLatLng = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);

      if (!userMarkerRef.current) {
        const svgMarker = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#06b6d4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        };

        userMarkerRef.current = new window.google.maps.Marker({
          position: userLatLng,
          map: mapInstanceRef.current,
          title: 'Your Live Position',
          icon: svgMarker,
          zIndex: 999,
        });
      } else {
        userMarkerRef.current.setPosition(userLatLng);
      }
    }

    // Initialize Autocomplete Search
    if (autocompleteInputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          types: ['(regions)'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const newLoc = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setUserLocation(newLoc);
          mapInstanceRef.current?.setCenter(newLoc);
          performNearbySearch(newLoc);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [mapsLoaded, userLocation, performNearbySearch]);

  // Initial Nearby Search when location & maps are ready
  useEffect(() => {
    if (mapsLoaded && userLocation && hospitals.length === 0 && !loading) {
      performNearbySearch(userLocation);
    }
  }, [mapsLoaded, userLocation, performNearbySearch, hospitals.length, loading]);

  // Render Hospital Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsLoaded) return;

    Object.values(markersRef.current).forEach((m) => m.setMap(null));
    markersRef.current = {};

    hospitals.forEach((h) => {
      if (!h.geometry || !h.geometry.location) return;

      const marker = new window.google.maps.Marker({
        position: h.geometry.location,
        map: mapInstanceRef.current,
        title: h.name,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: selectedHospitalId === h.place_id ? '#06b6d4' : '#ef4444',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; padding: 4px; max-width: 220px;">
            <h4 style="margin: 0 0 4px; font-weight: 700; font-size: 14px;">${h.name}</h4>
            <p style="margin: 0 0 4px; font-size: 11px; color: #475569;">${h.formatted_address || h.vicinity || 'Address not available'}</p>
            <div style="font-weight: 600; font-size: 11px; color: #0284c7;">${h.distanceText || ''} ${h.durationText ? '· ' + h.durationText : ''}</div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        setSelectedHospitalId(h.place_id);
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current[h.place_id] = marker;
    });
  }, [hospitals, mapsLoaded, selectedHospitalId]);

  const handleApplyCustomKey = (e) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setUserApiKey(inputKey.trim());
    }
  };

  const handleRecenterUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(userLocation);
      mapInstanceRef.current.setZoom(14);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold tracking-wide uppercase">
                Google Places API Verified
              </span>
              <span className="flex items-center text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Live Geolocation
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-2">
              Nearby Verified Hospitals & Real Distance
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Listings are pulled strictly from Google Places API with real-time driving distances via Distance Matrix API. Queue data is synchronized from backend records.
            </p>
          </div>

          <button
            onClick={() => performNearbySearch(userLocation)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-semibold text-xs transition-all hover:border-cyan-500/50 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Places</span>
          </button>
        </div>

        {/* Live Location Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-400 font-medium">Your Location:</span>
            <span className="text-slate-200 font-semibold truncate max-w-md">
              {locationAddress}
            </span>
          </div>
          {locationError && (
            <span className="text-amber-400 text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {locationError}
            </span>
          )}
        </div>
      </div>

      {/* API Key Missing / Config Prompt */}
      {loadError === 'API_KEY_MISSING' && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 space-y-3">
          <div className="flex items-start space-x-3">
            <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-300">
                Google Places API Key Required for Live Map & Distance Matrix
              </h4>
              <p className="text-xs text-amber-200/80 mt-1">
                Please add your key in <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-400">frontend/.env</code> as <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-400">VITE_GOOGLE_PLACES_KEY=YOUR_KEY</code> or paste it below to enable Google Nearby Search & Maps:
              </p>
            </div>
          </div>
          <form onSubmit={handleApplyCustomKey} className="flex gap-2 max-w-lg pt-1">
            <input
              type="text"
              placeholder="Paste Google Places API Key here..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="flex-1 bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Activate Key
            </button>
          </form>
        </div>
      )}

      {/* Search & Map Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Search City / Area Worldwide
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={autocompleteInputRef}
                type="text"
                value={searchLocationQuery}
                onChange={(e) => setSearchLocationQuery(e.target.value)}
                placeholder="Search city, neighborhood, or landmark..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Search Radius:</span>
                <span className="text-cyan-400 font-bold">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => performNearbySearch(userLocation)}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Search Nearby Hospitals
              </button>
              <button
                onClick={handleRecenterUser}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
                title="Recenter on My Location"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Verified Places Found:</span>
              <span className="text-white font-bold">{hospitals.length}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Sorted By:</span>
              <span className="text-cyan-400 font-semibold">Real Distance (Driving)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Queue Status Source:</span>
              <span className="text-emerald-400 font-semibold">Backend DB Layer</span>
            </div>
          </div>
        </div>

        {/* Map Column */}
        <div className="lg:col-span-2 relative min-h-[320px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl glass-card">
          <div ref={mapContainerRef} className="w-full h-full min-h-[340px]" />
          {!mapsLoaded && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">
                Loading Google Maps & Places JavaScript SDK...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs flex items-center space-x-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Hospital Cards Grid */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Verified Hospital Listings ({hospitals.length})</span>
          <span className="text-xs text-slate-400 font-normal">
            Strictly real Google Places data — No fake entries
          </span>
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-4 space-y-4"
              >
                <div className="h-32 rounded-xl bg-slate-800" />
                <div className="h-4 w-3/4 rounded bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-slate-800">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Nearby Hospitals Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try increasing the search radius or searching for a different city/region in the search bar above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((h) => {
              const queueInfo = hospitalQueues[h.place_id];
              const photoUrl =
                h.photos && h.photos.length > 0 && typeof h.photos[0].getUrl === 'function'
                  ? h.photos[0].getUrl({ maxWidth: 600, maxHeight: 400 })
                  : null;

              const isSelected = selectedHospitalId === h.place_id;

              return (
                <div
                  key={h.place_id}
                  onClick={() => setSelectedHospitalId(h.place_id)}
                  className={`glass-card rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
                  }`}
                >
                  {/* Card Banner / Photo */}
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={h.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-center">
                        <Building2 className="w-10 h-10 text-slate-700 mb-1" />
                        <span className="text-[11px] text-slate-500">No Photo Available</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Distance & Travel Time Badge */}
                    {h.distanceText && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-cyan-400 text-[11px] font-bold flex items-center space-x-1.5 shadow-md">
                        <Car className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {h.distanceText} · {h.durationText || 'Travel time N/A'}
                        </span>
                      </div>
                    )}

                    {/* Business Status */}
                    {h.business_status && (
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                        {h.business_status === 'OPERATIONAL' ? 'Operational' : h.business_status}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Name & Rating */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {h.name}
                        </h4>
                      </div>

                      {/* Ratings & Reviews */}
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                          <span>{h.rating ? h.rating.toFixed(1) : 'Not available'}</span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {h.user_ratings_total
                            ? `(${h.user_ratings_total} Google reviews)`
                            : '(No reviews)'}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start space-x-2 mt-3 text-xs text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {h.formatted_address || h.vicinity || 'Not available'}
                        </span>
                      </div>

                      {/* Phone & Opening Hours */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                          <span className="truncate">
                            {h.formatted_phone_number || 'Not available'}
                          </span>
                        </div>

                        <div className="flex items-center text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                          <span className="truncate">
                            {h.opening_hours
                              ? h.opening_hours.isOpen && h.opening_hours.isOpen()
                                ? 'Open Now'
                                : 'See Hours'
                              : 'Not available'}
                          </span>
                        </div>
                      </div>

                      {/* Types / Facility Chips */}
                      {h.types && h.types.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {h.types.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[10px] uppercase font-semibold"
                            >
                              {t.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Separate Queue Layer (Backend DB) */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            SmartQueue DB Status
                          </div>
                          {queueInfo ? (
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-xs font-bold text-white">
                                {queueInfo.currentQueueLength} waiting
                              </span>
                              <span className="text-xs text-slate-400">
                                (est. {queueInfo.avgWaitTimeMinutes}m wait)
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic mt-0.5">
                              Queue data not available yet
                            </div>
                          )}
                        </div>

                        {queueInfo ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              queueInfo.crowdStatus === 'Low'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : queueInfo.crowdStatus === 'High'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {queueInfo.crowdStatus}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] font-medium">
                            Unregistered
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {/* Verified Hospital Website Link */}
                        {h.website ? (
                          <a
                            href={h.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 font-semibold text-xs transition-colors"
                          >
                            <span>View Doctors & Departments →</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <button
                            disabled
                            className="w-full py-2 px-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed text-center"
                          >
                            Website Not Available
                          </button>
                        )}

                        {/* Join Virtual Queue CTA */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinQueue({
                              place_id: h.place_id,
                              name: h.name,
                              address: h.formatted_address || h.vicinity,
                              phone: h.formatted_phone_number,
                            });
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all"
                        >
                          <span>Get Virtual Token</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
