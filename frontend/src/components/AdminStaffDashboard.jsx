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
  LayoutDashboard
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

  // Hospital Metrics Form state
  const [crowdStatus, setCrowdStatus] = useState('Moderate');
  const [currentQueueLength, setCurrentQueueLength] = useState(5);
  const [avgWaitTimeMinutes, setAvgWaitTimeMinutes] = useState(15);
  const [emergencyServices, setEmergencyServices] = useState(true);

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

  const fetchHospitalQueueData = async (hospitalId) => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      // Fetch details & queue tokens
      const [hospRes, queueRes] = await Promise.all([
        api.get(`/hospitals/${hospitalId}`),
        api.get(`/queue/hospital/${hospitalId}`),
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
      const response = await api.put(`/queue/status/${tokenId}`, { status: newStatus });
      if (response.data.success) {
        const updatedToken = response.data.data;
        setQueueTokens((prev) =>
          prev.map((t) => (t._id === tokenId ? updatedToken : t))
        );

        if (onNotify) {
          onNotify({
            title: `Token ${updatedToken.tokenNumber} Updated`,
            message: `Status updated to ${newStatus} for patient ${updatedToken.username}.`,
            type: newStatus === 'Serving' ? 'alert' : 'status'
          });
        }

        // Refresh queue & hospital counts
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
            type: 'info'
          });
        }
      }
    } catch (err) {
      console.error('Error saving hospital metrics:', err);
    }
  };

  const currentlyServing = queueTokens.find((t) => t.status === 'Serving');
  const waitingTokens = queueTokens.filter((t) => t.status === 'Waiting');
  const completedTokens = queueTokens.filter((t) => t.status === 'Completed');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-900/40 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>HOSPITAL STAFF & ADMIN CONTROL PORTAL</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Live Queue Management Console</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Call patients, advance queue tokens, and update facility crowd metrics.
          </p>
        </div>

        {/* Facility Selector & View Switcher */}
        <div className="flex flex-wrap items-center gap-3">
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
              <span>Analytics & Insights</span>
            </button>
          </div>

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
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center">
                  <Volume2 className="w-4 h-4 mr-1.5 animate-pulse" />
                  Currently Called / Serving
                </span>
                <button
                  onClick={handleCallNextPatient}
                  disabled={actionLoading || waitingTokens.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Call Next Patient</span>
                </button>
              </div>

              {currentlyServing ? (
                <div className="mt-4 p-4 bg-slate-950/80 rounded-xl border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-3xl font-extrabold font-mono text-cyan-300 tracking-wider">
                      {currentlyServing.tokenNumber}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">
                      Patient: {currentlyServing.username}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Department: <strong className="text-cyan-400">{currentlyServing.department}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'Completed')}
                      className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Visit</span>
                    </button>
                    <button
                      onClick={() => handleUpdateTokenStatus(currentlyServing._id, 'Cancelled')}
                      className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Skip / Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-slate-300">No Patient Currently Being Served</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Call Next Patient" to call the first waiting patient in line.
                  </p>
                </div>
              )}
            </div>

            {/* Waiting Line Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Waiting Patients ({waitingTokens.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total in queue: <strong className="text-slate-200">{queueTokens.length}</strong>
                </span>
              </div>

              {waitingTokens.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl">
                  <p className="text-xs">Queue line is clear. No waiting patients.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase">
                        <th className="py-2.5 px-3">Pos</th>
                        <th className="py-2.5 px-3">Token #</th>
                        <th className="py-2.5 px-3">Patient</th>
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
                          <td className="py-3 px-3 text-slate-200 font-medium">{token.username}</td>
                          <td className="py-3 px-3 text-slate-300">{token.department}</td>
                          <td className="py-3 px-3 text-slate-400">{token.estimatedWaitMinutes} mins</td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateTokenStatus(token._id, 'Serving')}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[11px] font-semibold border border-emerald-500/30"
                            >
                              Serve Now
                            </button>
                            <button
                              onClick={() => handleUpdateTokenStatus(token._id, 'Cancelled')}
                              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded text-[11px] font-semibold border border-rose-500/30"
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

          {/* Right Column: Live Hospital Metric Adjuster */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Facility Metric Adjuster</span>
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  LIVE
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
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
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
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
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
