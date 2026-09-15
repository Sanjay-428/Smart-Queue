import React, { useState, useEffect } from 'react';
import { Ticket, Clock, Building2, Stethoscope, AlertTriangle, CheckCircle2, RefreshCw, XCircle, ChevronRight, UserCheck, QrCode, PauseCircle, PhoneCall, BellRing, Check, Sparkles, Activity } from 'lucide-react';
import api from '../api/axios';

const ActiveTokenCard = ({ token, onCancelled, onRefresh, onViewPass, addNotification }) => {
  const [cancelling, setCancelling] = useState(false);
  const [holding, setHolding] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(token?.smsPhoneNumber || '');
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (!token) return;
    const fetchAiPrediction = async () => {
      try {
        const targetHospId = token.hospitalId || 'sample';
        const res = await api.get(`/queue/predict-wait/${targetHospId}?department=${encodeURIComponent(token.department || '')}&queuePosition=${token.queuePosition || 1}`);
        if (res.data?.success) {
          setAiData(res.data.data);
        }
      } catch (e) {
        console.warn('AI predict fetch non-critical warning:', e);
      }
    };
    fetchAiPrediction();
  }, [token?.hospitalId, token?.department, token?.queuePosition]);

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
        if (addNotification) {
          addNotification({
            title: 'Token Cancelled',
            message: `Ticket ${token.tokenNumber} has been cancelled successfully.`,
            type: 'alert',
          });
        }
        onCancelled();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel token.');
    } finally {
      setCancelling(false);
    }
  };

  const handleHoldTurn = async () => {
    if (!window.confirm('Request a +15 minute hold on your turn? This will shift your queue position by 2 slots.')) {
      return;
    }

    setHolding(true);
    setErrorMsg('');

    try {
      const response = await api.post(`/queue/hold/${token._id}`);
      if (response.data?.success) {
        if (addNotification) {
          addNotification({
            title: 'Queue Hold Applied',
            message: `+15 min hold added to ${token.tokenNumber}. New Est. Wait: ~${response.data.data.estimatedWaitMinutes}m.`,
            type: 'info',
          });
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to request queue hold.');
    } finally {
      setHolding(false);
    }
  };

  const handleSaveSms = async (e) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.trim() === '') return;

    setSmsSaving(true);
    try {
      const response = await api.post('/queue/notify-sms', {
        tokenId: token._id,
        phoneNumber: phoneInput.trim(),
      });
      if (response.data?.success) {
        setSmsSuccess(true);
        if (addNotification) {
          addNotification({
            title: 'SMS Alerts Activated',
            message: `Live queue SMS updates configured for ${phoneInput.trim()}.`,
            type: 'status',
          });
        }
        setTimeout(() => {
          setSmsSuccess(false);
          setShowSmsModal(false);
          if (onRefresh) onRefresh();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to configure SMS alerts.');
    } finally {
      setSmsSaving(false);
    }
  };

  const handleEnableWebPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('SmartQueue Alerts Enabled', {
            body: `You will receive live desktop alerts for ticket ${token.tokenNumber}`,
            icon: '/favicon.ico',
          });
          if (addNotification) {
            addNotification({
              title: 'Desktop Push Enabled',
              message: 'Live web push alerts enabled for queue rank status.',
              type: 'status',
            });
          }
        }
      });
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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold uppercase tracking-wider shimmer-badge">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span> Live Pass Active
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/90 text-slate-300 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
              {token.department} Dept
            </span>
            {token.holdRequested && (
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                <PauseCircle className="w-3 h-3 text-amber-400" />
                +15m Hold Applied
              </span>
            )}
            {token.counterNumber && (
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 text-xs font-black animate-pulse flex items-center gap-1.5 shadow-lg shadow-emerald-500/10">
                📍 PROCEED TO {token.counterNumber.toUpperCase()}
              </span>
            )}
            {token.smsAlertsEnabled && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-emerald-400" />
                SMS Active
              </span>
            )}
          </div>

          <div>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              {token.hospitalName} <span className="text-slate-500">({token.hospitalCode})</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-3xl sm:text-5xl font-black text-cyan-300 bg-slate-950/90 px-4 sm:px-5 py-2 rounded-2xl border border-cyan-500/40 shadow-inner glow-cyan tracking-wider">
                {token.tokenNumber}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Ticket Issued To</div>
                <div className="text-sm font-bold text-white flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {token.patientName || token.username || 'Registered Patient'}
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
            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(15, Math.min(100, 100 - (token.queuePosition - 1) * 20))}%`,
                }}
              ></div>
            </div>
          </div>

          {/* AI Smart Prediction & Bottleneck Alert Banner */}
          {aiData && (
            <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3.5 space-y-2 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>AI SMART WAIT: ~{aiData.predictedWaitMinutes} MINS</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                    {aiData.confidenceRating}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>Flow:</span>
                  <span className={aiData.overallSeverity === 'critical' ? 'text-rose-400 font-bold' : aiData.overallSeverity === 'warning' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {aiData.overallStatus}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>🎯 Recommended Target Arrival Window:</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {aiData.recommendedArrivalWindow}
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-rose-400 text-xs font-semibold mt-1">{errorMsg}</p>
          )}

          {/* Quick Action Tools Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={onViewPass}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Digital Pass & QR</span>
            </button>

            <button
              onClick={handleHoldTurn}
              disabled={holding}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Shift turn by 2 positions (+15m)"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{holding ? 'Applying...' : 'Hold (+15m)'}</span>
            </button>

            <button
              onClick={() => setShowSmsModal(!showSmsModal)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>SMS Alerts</span>
            </button>

            <button
              onClick={handleEnableWebPush}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Enable Browser Desktop Notifications"
            >
              <BellRing className="w-3.5 h-3.5 text-indigo-400" />
              <span>Desktop Push</span>
            </button>
          </div>

          {/* Inline SMS Configuration Form */}
          {showSmsModal && (
            <form onSubmit={handleSaveSms} className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-3.5 space-y-2 mt-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  Enter Phone Number for Live Queue SMS
                </label>
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={smsSaving}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {smsSaving ? 'Saving...' : smsSuccess ? 'Saved!' : 'Enable SMS'}
                </button>
              </div>
            </form>
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

          {/* Main Action Buttons */}
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
