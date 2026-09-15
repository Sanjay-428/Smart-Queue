import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Clock,
  Volume2,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  AlertTriangle,
  Flame,
  Activity,
  Sliders,
  Bell,
  BarChart2,
  LayoutDashboard,
  Search,
  Filter,
  Megaphone,
  Radio,
  Sparkles
} from 'lucide-react';
import api from '../api/axios';
import QueueAnalyticsCharts from './QueueAnalyticsCharts';

export default function AdminStaffDashboard({ onNotify }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [queueTokens, setQueueTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // View mode tab: 'queue' or 'analytics'
  const [viewMode, setViewMode] = useState('queue');

  // OPD Counter Assignment
  const [selectedCounter, setSelectedCounter] = useState('Counter 1');

  // Waiting Line Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [searchPatient, setSearchPatient] = useState('');

  // Emergency Delay Broadcast state
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('Emergency trauma intake');
  const [broadcasting, setBroadcasting] = useState(false);

  // Hospital Metrics Form state
  const [crowdStatus, setCrowdStatus] = useState('Moderate');
  const [currentQueueLength, setCurrentQueueLength] = useState(5);
  const [avgWaitTimeMinutes, setAvgWaitTimeMinutes] = useState(15);
  const [emergencyServices, setEmergencyServices] = useState(true);

  // Text-To-Speech Vocalizer
  const speakAnnouncement = (tokenNum, counterName) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const cleanToken = (tokenNum || '').replace(/-/g, ' ');
        const text = `Attention. Token Number ${cleanToken}, please proceed to OPD ${counterName || 'Counter 1'}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis warning:', err.message);
      }
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      if (response.data.success && response.data.data.length > 0) {
        setHospitals(response.data.data);
        if (!selectedHospitalId) {
          setSelectedHospitalId(response.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching hospitals for staff portal:', err);
    }
  };

  const [aiPredict, setAiPredict] = useState(null);

  const fetchHospitalQueueData = async (hospitalId) => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const [hospRes, queueRes, aiRes] = await Promise.all([
        api.get(`/hospitals/${hospitalId}`),
        api.get(`/queue/hospital/${hospitalId}`),
        api.get(`/queue/predict-wait/${hospitalId}`).catch(() => ({ data: null })),
      ]);

      if (hospRes.data.success) {
        const hosp = hospRes.data.data;
        setHospitalDetails(hosp);
        setCrowdStatus(hosp.crowdStatus || 'Moderate');
        setCurrentQueueLength(hosp.currentQueueLength || 0);
        setAvgWaitTimeMinutes(hosp.avgWaitTimeMinutes || 15);
        setEmergencyServices(hosp.emergencyServices ?? true);
      }

      if (queueRes.data.success) {
        setQueueTokens(queueRes.data.data);
      }

      if (aiRes.data?.success) {
        setAiPredict(aiRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching hospital queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      fetchHospitalQueueData(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  // Update token status (Serving / Completed / Cancelled)
  const handleUpdateTokenStatus = async (tokenId, newStatus) => {
    setActionLoading(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'Serving') {
        payload.counterNumber = selectedCounter;
      }

      const response = await api.put(`/queue/status/${tokenId}`, payload);
      if (response.data.success) {
        const updatedToken = response.data.data;
        setQueueTokens((prev) =>
          prev.map((t) => (t._id === tokenId ? updatedToken : t))
        );

        if (newStatus === 'Serving') {
          speakAnnouncement(updatedToken.tokenNumber, selectedCounter);
        }

        if (onNotify) {
          onNotify({
            title: `Token ${updatedToken.tokenNumber} Called`,
            message: `Status set to ${newStatus} on ${selectedCounter} for patient ${updatedToken.username}.`,
            type: newStatus === 'Serving' ? 'alert' : 'status',
          });
        }

        fetchHospitalQueueData(selectedHospitalId);
      }
    } catch (err) {
      console.error('Error updating token status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Advance to Call Next Patient
  const handleCallNextPatient = async () => {
    const nextWaiting = queueTokens.find((t) => t.status === 'Waiting');
    if (!nextWaiting) {
      alert('No patients currently waiting in line!');
      return;
    }
    await handleUpdateTokenStatus(nextWaiting._id, 'Serving');
  };

  // Emergency Delay Broadcast
  const handleBroadcastDelay = async (e) => {
    e.preventDefault();
    if (!selectedHospitalId) return;

    setBroadcasting(true);
    try {
      const response = await api.post('/queue/broadcast-delay', {
        hospitalId: selectedHospitalId,
        delayMinutes: Number(delayMinutes),
        reason: delayReason,
      });

      if (response.data.success) {
        if (onNotify) {
          onNotify({
            title: 'Emergency Delay Broadcasted',
            message: `+${delayMinutes}m delay broadcast sent to waiting patients. (${delayReason})`,
            type: 'alert',
          });
        }
        setShowDelayModal(false);
        fetchHospitalQueueData(selectedHospitalId);
      }
    } catch (err) {
      console.error('Error broadcasting delay:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  // Save modified hospital parameters
  const handleSaveHospitalMetrics = async () => {
    if (!selectedHospitalId) return;
    try {
      const response = await api.put(`/hospitals/${selectedHospitalId}`, {
        crowdStatus,
        currentQueueLength: Number(currentQueueLength),
        avgWaitTimeMinutes: Number(avgWaitTimeMinutes),
        emergencyServices,
      });

      if (response.data.success) {
        setHospitalDetails(response.data.data);
        if (onNotify) {
          onNotify({
            title: 'Hospital Metrics Updated',
            message: `Live parameters updated for ${hospitalDetails?.name}.`,
            type: 'info',
          });
        }
      }
    } catch (err) {
      console.error('Error saving hospital metrics:', err);
    }
  };

  const currentlyServing = queueTokens.find((t) => t.status === 'Serving');
  const allWaitingTokens = queueTokens.filter((t) => t.status === 'Waiting');
  const completedTokens = queueTokens.filter((t) => t.status === 'Completed');

  // Filtered waiting tokens by department and search text
  const waitingTokens = allWaitingTokens.filter((t) => {
    if (selectedDeptFilter !== 'All' && t.department !== selectedDeptFilter) {
      return false;
    }
    if (searchPatient.trim() !== '') {
      const s = searchPatient.trim().toLowerCase();
      return (
        t.tokenNumber.toLowerCase().includes(s) ||
        t.username.toLowerCase().includes(s) ||
        t.department.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const availableDepartments = ['All', ...new Set(queueTokens.map((t) => t.department))];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Control Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>HOSPITAL STAFF & ADMIN CONTROL PORTAL</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 mt-1">Live OPD Queue Console</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Call patient tokens, assign OPD desks, broadcast voice announcements, and control crowd metrics.
          </p>
        </div>

        {/* Facility Selector & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Active OPD Counter Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-800/60 shadow-md">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 uppercase">My Desk:</span>
            <select
              value={selectedCounter}
              onChange={(e) => setSelectedCounter(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer"
            >
              <option value="Counter 1" className="bg-slate-950 text-slate-200">Counter 1 - General OPD</option>
              <option value="Counter 2" className="bg-slate-950 text-slate-200">Counter 2 - Cardiology</option>
              <option value="Counter 3" className="bg-slate-950 text-slate-200">Counter 3 - Pediatrics</option>
              <option value="Desk A" className="bg-slate-950 text-slate-200">Desk A - Registration</option>
              <option value="Desk B" className="bg-slate-950 text-slate-200">Desk B - Emergency Intake</option>
            </select>
          </div>

          {/* Emergency Delay Trigger Button */}
          <button
            onClick={() => setShowDelayModal(true)}
            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Broadcast emergency delay to all waiting patients"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Emergency Broadcast</span>
          </button>

          {/* View Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-purple-800/60">
            <button
              onClick={() => setViewMode('queue')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'queue'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Queue Console</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Facility Selection */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-purple-800/60 rounded-xl text-xs font-semibold text-purple-200 focus:outline-none focus:border-purple-500"
            >
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} ({h.code})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Emergency Delay Modal */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Megaphone className="w-4 h-4" />
                <span>Broadcast Emergency OPD Delay</span>
              </div>
              <button
                onClick={() => setShowDelayModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastDelay} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Delay Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Broadcast Reason Notice
                </label>
                <input
                  type="text"
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="e.g. Emergency trauma intake or doctor delay"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDelayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  {broadcasting ? 'Broadcasting...' : 'Send Emergency Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Staff Dashboard Layout */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading queue console data...</p>
        </div>
      ) : viewMode === 'analytics' ? (
        <QueueAnalyticsCharts
          hospitalName={hospitalDetails?.name}
          queueTokens={queueTokens}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Live Queue Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Now Serving Highlight Card */}
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 relative overflow-hidden shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center">
                    <Volume2 className="w-4 h-4 mr-1.5 animate-pulse text-cyan-400" />
                    Currently Called / Serving
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    {selectedCounter}
                  </span>
                </div>

                <button
                  onClick={handleCallNextPatient}
                  disabled={actionLoading || allWaitingTokens.length === 0}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>CALL NEXT PATIENT ({selectedCounter})</span>
                </button>
              </div>

              {currentlyServing ? (
                <div className="mt-4 p-5 bg-slate-950/90 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300 tracking-wider">
                        {currentlyServing.tokenNumber}
                      </span>
                      <button
                        onClick={() => speakAnnouncement(currentlyServing.tokenNumber, selectedCounter)}
                        className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Replay Voice Vocalizer Announcement"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Replay Voice</span>
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 mt-1.5">
                      Patient: {currentlyServing.patientName || currentlyServing.username}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Department: <strong className="text-cyan-400">{currentlyServing.department}</strong></span>
                      <span>•</span>
                      <span>Assigned: <strong className="text-emerald-400">{currentlyServing.counterNumber || selectedCounter}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'Completed')}
                      className="px-3.5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Visit</span>
                    </button>
                    <button
                      onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'Cancelled')}
                      className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Skip / Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-300">No Patient Currently Being Served on {selectedCounter}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "CALL NEXT PATIENT" to advance the line and vocalize the voice announcement.
                  </p>
                </div>
              )}
            </div>

            {/* Waiting Line Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              
              {/* Header & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Waiting Patients ({waitingTokens.length})
                  </h3>
                </div>

                {/* Patient Search Input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search token code or name..."
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-1.5 outline-none"
                  />
                </div>
              </div>

              {/* Department Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center mr-1">
                  <Filter className="w-3 h-3 mr-1" /> Dept:
                </span>
                {availableDepartments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedDeptFilter === dept
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {waitingTokens.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  <p className="text-xs">No waiting patients matching criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase">
                        <th className="py-2.5 px-3">Pos</th>
                        <th className="py-2.5 px-3">Token #</th>
                        <th className="py-2.5 px-3">Patient Name</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Est Wait</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {waitingTokens.map((token, index) => (
                        <tr key={token._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-bold text-amber-400">#{index + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                            {token.tokenNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-200 font-medium">
                            {token.patientName || token.username}
                            {token.holdRequested && (
                              <span className="ml-2 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                +15m Hold
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{token.department}</td>
                          <td className="py-3 px-3 text-slate-400">~{token.estimatedWaitMinutes} mins</td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateTokenStatus(token._id, 'Serving')}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/30 cursor-pointer"
                            >
                              Call to {selectedCounter}
                            </button>
                            <button
                              onClick={() => handleUpdateTokenStatus(token._id, 'Cancelled')}
                              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-[11px] font-bold border border-rose-500/30 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: AI Bottleneck Detector + Live Hospital Metric Adjuster */}
          <div className="space-y-6">
            
            {/* AI Bottleneck Alerts & Shift Re-balancer Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-cyan-950/20 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>AI Bottleneck Detector</span>
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                  aiPredict?.overallSeverity === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : aiPredict?.overallSeverity === 'warning'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {aiPredict?.overallStatus || 'Active Monitoring'}
                </span>
              </div>

              {aiPredict?.bottlenecks && aiPredict.bottlenecks.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> High OPD Department Congestion:
                  </div>
                  {aiPredict.bottlenecks.map((b, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>{b.department} OPD</span>
                        <span className="text-rose-400">{b.waitingCount} Waiting Patients</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {b.suggestion}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedDeptFilter(b.department);
                          if (onNotify) {
                            onNotify({
                              title: 'Desk Re-assigned',
                              message: `Switched Desk Filter to ${b.department} for counter balancing.`,
                              type: 'info',
                            });
                          }
                        }}
                        className="w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        ⚡ Re-assign Counter to {b.department}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center space-y-1">
                  <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Balanced Counter Distribution</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    No active department congestion detected. Average OPD wait is under 15 mins across all desks.
                  </p>
                </div>
              )}
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Facility Metric Adjuster</span>
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  LIVE SYNC
                </span>
              </div>

              {/* Crowd Status Radio */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Current Crowd Congestion
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Low', 'Moderate', 'High', 'Critical'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCrowdStatus(status)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        crowdStatus === status
                          ? status === 'Low'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : status === 'Moderate'
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            : status === 'High'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Queue & Wait time */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Queue Count Override</label>
                  <input
                    type="number"
                    value={currentQueueLength}
                    onChange={(e) => setCurrentQueueLength(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Avg Wait Time (Minutes)</label>
                  <input
                    type="number"
                    value={avgWaitTimeMinutes}
                    onChange={(e) => setAvgWaitTimeMinutes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Emergency Services Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-300 font-medium">Emergency Services Active</span>
                  <input
                    type="checkbox"
                    checked={emergencyServices}
                    onChange={(e) => setEmergencyServices(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveHospitalMetrics}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Publish Live Updates
              </button>
            </div>

            {/* Quick Analytics Card */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Shift Analytics Summary
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Total Served</span>
                  <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                    {completedTokens.length} Patients
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Wait Time Avg</span>
                  <span className="text-lg font-bold text-cyan-400 mt-0.5 block">
                    {avgWaitTimeMinutes} mins
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
