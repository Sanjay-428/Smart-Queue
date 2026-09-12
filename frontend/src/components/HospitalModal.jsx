import React from 'react';
import { X, MapPin, Phone, Clock, AlertTriangle, ShieldCheck, Users, Activity, Star, Stethoscope } from 'lucide-react';

const HospitalModal = ({ hospital, onClose, onJoinQueue }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
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
              {hospital.district}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
              Code: {hospital.code}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getCrowdBadgeStyle(hospital.crowdStatus)}`}>
              {hospital.crowdStatus} Queue Level
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white">{hospital.name}</h2>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="font-bold">{hospital.rating}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>{hospital.address}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Current Queue</span>
              </div>
              <div className="text-xl font-bold text-white">
                {hospital.currentQueueLength} <span className="text-xs text-slate-400 font-normal">patients in line</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Est. Wait Time</span>
              </div>
              <div className="text-xl font-bold text-teal-300">
                ~{hospital.avgWaitTimeMinutes} <span className="text-xs text-slate-400 font-normal">mins</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Emergency Unit</span>
              </div>
              <div className="text-sm font-semibold text-white">
                {hospital.emergencyServices ? (
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
                <span>{hospital.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{hospital.operatingHours}</span>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              Available Departments & Care Units
            </h4>
            <div className="flex flex-wrap gap-2">
              {hospital.departments && hospital.departments.map((dept, index) => (
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
              <div className="text-slate-400 text-xs">Instant token issue & live position tracking for {hospital.name}.</div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onJoinQueue) onJoinQueue(hospital);
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
