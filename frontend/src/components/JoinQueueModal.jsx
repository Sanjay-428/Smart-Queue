import React, { useState } from 'react';
import { X, Building2, Stethoscope, Clock, Users, Ticket, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const JoinQueueModal = ({ hospital, onClose, onSuccess }) => {
  const deptsList = hospital?.departments && hospital.departments.length > 0
    ? hospital.departments
    : ['General Medicine', 'Outpatient OPD', 'Emergency Care', 'Pediatrics', 'Cardiology'];

  const [selectedDept, setSelectedDept] = useState(deptsList[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!hospital) return null;

  const handleConfirmJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        department: selectedDept,
      };

      if (hospital._id) {
        payload.hospitalId = hospital._id;
      }
      if (hospital.place_id) {
        payload.placeId = hospital.place_id;
        payload.hospitalName = hospital.name;
      }

      const response = await api.post('/queue/join', payload);

      if (response.data?.success) {
        onSuccess(response.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join queue. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-blue-900/40 to-teal-900/30">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Join Virtual Queue</h3>
              <p className="text-xs text-slate-400">{hospital.name}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleConfirmJoin} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              Select Care Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 text-white text-xs rounded-xl p-3.5 outline-none cursor-pointer"
            >
              {deptsList.map((dept, idx) => (
                <option key={idx} value={dept} className="bg-slate-900 text-white">
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Queue Estimate Summary */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Current Queue
              </div>
              <div className="text-base font-bold text-white mt-1">
                {hospital.currentQueueLength + 1} <span className="text-xs font-normal text-slate-400">your spot</span>
              </div>
            </div>

            <div>
              <div className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Est. Wait Time
              </div>
              <div className="text-base font-bold text-teal-300 mt-1">
                ~{Math.max(10, (hospital.currentQueueLength + 1) * 8)} mins
              </div>
            </div>
          </div>

          {/* Confirm Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Issuing Token...</span>
                </>
              ) : (
                <span>Confirm & Get Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinQueueModal;
