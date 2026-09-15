import React, { useState } from 'react';
import { UserCheck, Building2, MapPin, Clock, Calendar, Star, Briefcase, Stethoscope, Check, X, ShieldCheck, Ticket, Sparkles, Award } from 'lucide-react';
import api from '../api/axios';

export default function DoctorDetailModal({ doctor, isOpen, onClose, onBookSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState('09:00 AM - 12:00 PM (Morning OPD)');
  const [booking, setBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !doctor) return null;

  const timeSlots = [
    { id: 'morning', label: '09:00 AM - 12:00 PM (Morning OPD)', icon: '🌅', spots: '3 slots open' },
    { id: 'afternoon', label: '02:00 PM - 05:00 PM (Afternoon OPD)', icon: '☀️', spots: '5 slots open' },
    { id: 'evening', label: '06:00 PM - 08:00 PM (Evening OPD)', icon: '🌙', spots: '2 slots open' },
  ];

  const handleConfirmBooking = async () => {
    setBooking(true);
    setErrorMsg('');

    try {
      const payload = {
        hospitalId: doctor.hospitalId,
        department: doctor.specialty || 'General Medicine',
        hospitalName: doctor.hospitalName,
      };

      const response = await api.post('/queue/join', payload);
      if (response.data?.success) {
        if (onBookSuccess) {
          onBookSuccess(response.data.data, doctor, selectedSlot);
        }
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to book doctor appointment slot.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0a162b] to-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Specialist OPD Consultation</h3>
              <p className="text-[11px] text-cyan-400 font-mono">VERIFIED SPECIALIST PROFILE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Info */}
        <div className="space-y-4 relative z-10">
          
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <img
              src={doctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover border border-cyan-500/40 shadow-lg flex-shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold text-white">{doctor.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● {doctor.status || 'On Duty'}
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-semibold mt-0.5">{doctor.specialty} Specialist</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{doctor.title || 'MD, Senior Consultant'}</p>
              
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> 4.9 Rating
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Award className="w-3.5 h-3.5 text-cyan-400" /> {doctor.experienceYears || 8}+ Yrs Exp
                </span>
              </div>
            </div>
          </div>

          {/* OPD Room & Facility details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Hospital Facility</span>
              <span className="font-bold text-slate-200 block truncate flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                {doctor.hospitalName}
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">OPD Room Number</span>
              <span className="font-mono font-bold text-cyan-300 block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {doctor.roomNumber || 'Room 102'}
              </span>
            </div>
          </div>

          {/* OPD Slot Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Select Available OPD Consultation Slot
            </label>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.label)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedSlot === slot.label
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-md'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base">{slot.icon}</span>
                    <div>
                      <span className="text-xs font-bold block">{slot.label}</span>
                      <span className="text-[10px] text-slate-400">{slot.spots}</span>
                    </div>
                  </div>
                  {selectedSlot === slot.label && (
                    <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-rose-400 text-xs font-semibold">{errorMsg}</p>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={booking}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {booking ? (
                <span>Booking Slot...</span>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-slate-950" />
                  <span>Confirm & Get Token</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
