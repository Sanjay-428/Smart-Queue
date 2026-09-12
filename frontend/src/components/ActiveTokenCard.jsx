import React, { useState } from 'react';
import { Ticket, Clock, Building2, Stethoscope, AlertTriangle, CheckCircle2, RefreshCw, XCircle, ChevronRight, UserCheck } from 'lucide-react';
import api from '../api/axios';

const ActiveTokenCard = ({ token, onCancelled, onRefresh }) => {
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) return null;

  const handleCancel = async () => {
    if (!window.confirm(`Are you sure you want to cancel ticket ${token.tokenNumber}?`)) {
      return;
    }

    setCancelling(true);
    setErrorMsg('');

    try {
      const response = await api.post(`/queue/cancel/${token._id}`);
      if (response.data?.success) {
        onCancelled();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel token.');
    } finally {
      setCancelling(false);
    }
  };

  // Status step calculation
  const position = token.queuePosition || 1;
  const isNext = position === 1;

  return (
    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-cyan-500/40 relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#0a152d] to-cyan-950/30 shadow-2xl mb-8 group">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all"></div>
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        
        {/* Left Side: Pass Details */}
        <div className="space-y-4 max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold uppercase tracking-wider shimmer-badge">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> Live Pass Active
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/90 text-slate-300 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              {token.department} Dept
            </span>
          </div>

          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              {token.hospitalName} <span className="text-slate-500">({token.hospitalCode})</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-300 bg-slate-950/90 px-5 py-2 rounded-2xl border border-cyan-500/40 shadow-inner glow-cyan tracking-wider">
                {token.tokenNumber}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Ticket Issued To</div>
                <div className="text-sm font-bold text-white flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {token.patientName || 'Registered Patient'}
                </div>
              </div>
            </div>
          </div>

          {/* Queue Status Progression Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>Token Registered</span>
              <span className={isNext ? "text-amber-400 font-bold" : "text-cyan-400"}>
                {isNext ? "⚡ YOU ARE NEXT IN LINE!" : `In Line (Position #${token.queuePosition})`}
              </span>
              <span>Consultation</span>
            </div>
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(15, Math.min(100, 100 - (token.queuePosition - 1) * 20))}%`,
                }}
              ></div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-rose-400 text-xs font-semibold mt-1">{errorMsg}</p>
          )}
        </div>

        {/* Right Side: Position Counter & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-8">
          
          {/* Position Stat Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[140px] shadow-lg">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Queue Rank</div>
            <div className="text-4xl font-black text-white tracking-tight">
              #{token.queuePosition}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium mt-0.5">Ahead of you</div>
          </div>

          {/* Wait Time Stat Box */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[140px] shadow-lg">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Est. Turn In</div>
            <div className="text-3xl font-black text-cyan-300 flex items-center justify-center gap-1">
              <Clock className="w-5 h-5 text-cyan-400" />
              ~{token.estimatedWaitMinutes}m
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Live Sync</div>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-center gap-2">
            <button
              onClick={onRefresh}
              className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:border-cyan-500/40"
              title="Sync Status"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Refresh Status</span>
            </button>

            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Token'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ActiveTokenCard;

