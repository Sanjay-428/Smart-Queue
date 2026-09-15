import React, { useEffect, useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Users,
  Star,
  Stethoscope,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Building2
} from 'lucide-react';
import api from '../api/axios';

const HospitalModal = ({ hospital, onClose, onJoinQueue }) => {
  const [details, setDetails] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const placeId = hospital?.place_id || hospital?.googlePlaceId || (hospital?._id && typeof hospital._id === 'string' && hospital._id.length > 10 ? hospital._id : null);

  useEffect(() => {
    if (!hospital) return;

    let isMounted = true;
    setLoadingDetails(true);

    const loadRealData = async () => {
      try {
        if (placeId) {
          // Parallel fetch for Google Place Details & DB Queue Status
          const [detailsRes, queueRes] = await Promise.allSettled([
            api.get(`/hospitals/details/${placeId}`),
            api.get(`/queue/place/${placeId}`),
          ]);

          if (isMounted) {
            if (detailsRes.status === 'fulfilled' && detailsRes.value.data?.success) {
              setDetails(detailsRes.value.data.data);
            }
            if (queueRes.status === 'fulfilled' && queueRes.value.data?.available) {
              setQueueData(queueRes.value.data.data);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading modal real data:', err.message);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [hospital, placeId]);

  if (!hospital) return null;

  const getCrowdBadgeStyle = (status) => {
    switch (status) {
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  // Merged Fields
  const name = details?.name || hospital.name;
  const address = details?.formatted_address || hospital.address || 'Not available';
  const phone = details?.formatted_phone_number || hospital.phone || 'Not available';
  const website = details?.website || hospital.website || null;
  const rating = details?.rating || hospital.rating || 'Not available';
  const userRatingsTotal = details?.user_ratings_total || hospital.user_ratings_total || 0;
  const operatingHours = details?.opening_hours || hospital.operatingHours || 'Not available';
  const emergency = details ? true : hospital.emergencyServices;
  const district = hospital.district || 'Tamil Nadu Region';
  const code = hospital.code || (placeId ? `PLC-${placeId.substring(0, 6).toUpperCase()}` : 'HOSP');

  const crowdStatus = queueData?.crowdStatus || hospital.crowdStatus || 'Low';
  const currentQueue = queueData?.currentQueueLength ?? (typeof hospital.currentQueueLength === 'number' ? hospital.currentQueueLength : 'Not available');
  const avgWait = queueData?.avgWaitTimeMinutes ?? (typeof hospital.avgWaitTimeMinutes === 'number' ? hospital.avgWaitTimeMinutes : 'Not available');

  const photos = details?.photos || [];
  const reviews = details?.reviews || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header Banner */}
        <div className="p-6 md:p-8 border-b border-slate-800 bg-gradient-to-r from-blue-900/40 via-slate-900 to-teal-900/30 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
              {district}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
              Code: {code}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCrowdBadgeStyle(crowdStatus)}`}>
              {crowdStatus} Queue Level
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white">{name}</h2>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-300">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="font-bold">{rating}</span>
              {userRatingsTotal > 0 && <span className="text-slate-400 font-normal">({userRatingsTotal} Google reviews)</span>}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 truncate max-w-md">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Loading Indicator */}
          {loadingDetails && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs flex items-center space-x-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Fetching real verified Google Places & Queue data...</span>
            </div>
          )}

          {/* Photo Banner */}
          {photos.length > 0 && (
            <div className="h-44 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800">
              <img
                src={photos[0].proxy_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Current Queue</span>
              </div>
              <div className="text-xl font-bold text-white">
                {typeof currentQueue === 'number' ? (
                  <>
                    {currentQueue} <span className="text-xs text-slate-400 font-normal">patients in line</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">Not available</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Est. Wait Time</span>
              </div>
              <div className="text-xl font-bold text-teal-300">
                {typeof avgWait === 'number' ? (
                  <>
                    ~{avgWait} <span className="text-xs text-slate-400 font-normal">mins</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">Not available</span>
                )}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Emergency Unit</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {emergency ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 24/7 Available
                  </span>
                ) : (
                  <span className="text-slate-400">Outpatient Only</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Facility Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="truncate">{operatingHours}</span>
              </div>
            </div>

            {/* Official Website Link */}
            {website ? (
              <div className="pt-2 border-t border-slate-800/80">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>View Doctors & Departments →</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-500 italic">
                Official Website: Not available
              </div>
            )}
          </div>

          {/* Top Google Reviews Section */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Verified Patient Reviews
              </h4>
              <div className="space-y-2">
                {reviews.map((rev, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{rev.author_name}</span>
                      <div className="flex items-center text-amber-400 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 mr-1" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-400 line-clamp-2">{rev.text || 'No written text.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              Available Departments & Care Units
            </h4>
            <div className="flex flex-wrap gap-2">
              {(hospital.departments || ['General Medicine', 'Outpatient OPD', 'Emergency Care', 'Pediatrics', 'Cardiology']).map((dept, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 font-medium"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Virtual Queue Action */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 to-teal-900/20 border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white text-sm">Join Virtual Queue Now</div>
              <div className="text-slate-400 text-xs">Instant token issue & live position tracking for {name}.</div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onJoinQueue) onJoinQueue({ ...hospital, place_id: placeId, name });
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              Get Virtual Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalModal;
