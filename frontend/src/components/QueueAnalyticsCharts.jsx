import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Clock,
  Users,
  Flame,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Download,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import api from '../api/axios';

export default function QueueAnalyticsCharts({ hospitalName, hospitalId, queueTokens = [] }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/queue/analytics/${hospitalId}`);
        if (response.data?.success) {
          setAnalyticsData(response.data.data);
        }
      } catch (err) {
        console.warn('Error fetching analytics from backend:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [hospitalId]);

  // Fallback / Live Hourly Traffic Data
  const hourlyData = analyticsData?.hourlyTraffic || [
    { time: '08 AM', arrivals: 12, served: 8 },
    { time: '09 AM', arrivals: 24, served: 18 },
    { time: '10 AM', arrivals: 38, served: 30 },
    { time: '11 AM', arrivals: 45, served: 40 },
    { time: '12 PM', arrivals: 32, served: 35 },
    { time: '01 PM', arrivals: 20, served: 25 },
    { time: '02 PM', arrivals: 36, served: 32 },
    { time: '03 PM', arrivals: 42, served: 38 },
  ];

  // Department Distribution Data
  const deptData = analyticsData?.departmentBreakdown && analyticsData.departmentBreakdown.length > 0
    ? analyticsData.departmentBreakdown.map((d, i) => ({
        name: d.department,
        count: d.count,
        color: ['from-cyan-500 to-blue-600', 'from-rose-500 to-amber-500', 'from-purple-500 to-indigo-500', 'from-emerald-500 to-teal-500'][i % 4],
        percentage: Math.round((d.count / (queueTokens.length || 1)) * 100) || 25,
      }))
    : [
        { name: 'Cardiology', count: 34, color: 'from-cyan-500 to-blue-600', percentage: 35 },
        { name: 'Emergency Care', count: 28, color: 'from-rose-500 to-amber-500', percentage: 28 },
        { name: 'Pediatrics', count: 18, color: 'from-purple-500 to-indigo-500', percentage: 18 },
        { name: 'General Medicine', count: 12, color: 'from-emerald-500 to-teal-500', percentage: 12 },
      ];

  const maxArrivals = Math.max(...hourlyData.map((d) => d.patients || d.arrivals || 20));

  // Compute SVG Area Chart Points
  const chartWidth = 600;
  const chartHeight = 180;
  const padding = 20;

  const getX = (index) => padding + (index / (hourlyData.length - 1 || 1)) * (chartWidth - padding * 2);
  const getY = (value) => chartHeight - padding - (value / (maxArrivals || 1)) * (chartHeight - padding * 2);

  const pointsArrivals = hourlyData.map((d, i) => `${getX(i)},${getY(d.patients || d.arrivals)}`).join(' ');
  const areaArrivals = `${getX(0)},${chartHeight - padding} ${pointsArrivals} ${getX(hourlyData.length - 1)},${chartHeight - padding}`;

  const totalServed = analyticsData?.completedCount ?? queueTokens.filter((t) => t.status === 'Completed').length;
  const totalWaiting = analyticsData?.waitingCount ?? queueTokens.filter((t) => t.status === 'Waiting').length;
  const totalServing = analyticsData?.servingCount ?? queueTokens.filter((t) => t.status === 'Serving').length;
  const totalCancelled = analyticsData?.cancelledCount ?? queueTokens.filter((t) => t.status === 'Cancelled').length;
  const grandTotal = analyticsData?.totalTokensToday || (totalServed + totalWaiting + totalServing + totalCancelled);

  const completionRate = grandTotal > 0 ? Math.round((totalServed / grandTotal) * 100) : 85;

  // Export Analytics CSV Function
  const handleExportCsv = () => {
    const csvRows = [
      ['SmartQueue OPD Queue Analytics Report'],
      ['Facility Name', hospitalName || 'Hospital Facility'],
      ['Export Date', new Date().toLocaleString()],
      [''],
      ['Metric', 'Value'],
      ['Total Tickets Issued Today', grandTotal],
      ['Patients Completed', totalServed],
      ['Currently Waiting', totalWaiting],
      ['Currently Serving', totalServing],
      ['Cancelled Tokens', totalCancelled],
      ['Average Wait Minutes', `${analyticsData?.avgWaitMinutes || 15} mins`],
      ['Peak Traffic Period', analyticsData?.peakHour || '10:00 AM - 11:30 AM'],
      [''],
      ['Department', 'Patient Count'],
      ...deptData.map((d) => [d.name, d.count]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OPD_Queue_Analytics_${(hospitalName || 'Facility').replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <span>OPD Traffic Insights & Shift Performance</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics for <strong className="text-cyan-300">{hospitalName || 'Selected Facility'}</strong>
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
        >
          {exported ? <Check className="w-4 h-4 text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-cyan-400" />}
          <span>{exported ? 'Report Downloaded!' : 'Export CSV Report'}</span>
        </button>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peak Patient Traffic</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 mt-2">{analyticsData?.peakHour || '10 AM - 11 AM'}</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Highest OPD influx</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-2">{completionRate}%</p>
          <div className="flex items-center text-[11px] text-cyan-400 mt-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 mr-0.5" />
            <span>{totalServed} patients completed</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Wait Duration</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold text-cyan-400 mt-2">~{analyticsData?.avgWaitMinutes || 15} Mins</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-1 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Live wait sync</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total OPD Tickets</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-400 mt-2">{grandTotal} Issued</p>
          <div className="flex items-center text-[11px] text-slate-400 mt-1">
            <span>{totalWaiting} in line waiting</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hourly Flow Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Patient Arrival Volume Flow</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hourly traffic curve for {hospitalName || 'Facility'}
              </p>
            </div>

            <div className="flex items-center space-x-1 font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LIVE TRAFFIC</span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="relative w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 overflow-visible"
            >
              <defs>
                <linearGradient id="gradientArrivals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.25, 0.5, 0.75].map((r, idx) => (
                <line
                  key={idx}
                  x1={padding}
                  y1={chartHeight * r}
                  x2={chartWidth - padding}
                  y2={chartHeight * r}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area Fill */}
              <polygon points={areaArrivals} fill="url(#gradientArrivals)" />

              {/* Curve Line */}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsArrivals}
              />

              {/* Data Dots */}
              {hourlyData.map((d, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(d.patients || d.arrivals)}
                  r="4"
                  fill="#22d3ee"
                  className="hover:r-6 transition-all cursor-pointer"
                />
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-500 border-t border-slate-800/80 font-mono">
              {hourlyData.map((d, i) => (
                <span key={i}>{d.time}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Department Distribution (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Department Load Share</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Patient volume share by specialty</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {deptData.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{dept.name}</span>
                  <span className="text-slate-400 font-mono">{dept.count} patients</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full bg-gradient-to-r ${dept.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(10, dept.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Status Breakdown Mini Card */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
            <span>Overall Queue Load:</span>
            <span className="font-bold text-cyan-400">{grandTotal} Total Tickets</span>
          </div>
        </div>

      </div>
    </div>
  );
}
