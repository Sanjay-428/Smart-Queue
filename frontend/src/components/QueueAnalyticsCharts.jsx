import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function QueueAnalyticsCharts({ hospitalName, queueTokens = [] }) {
  const [activeMetric, setActiveMetric] = useState('hourly');

  // Simulated Hourly Data (08:00 AM to 06:00 PM)
  const hourlyData = [
    { time: '08 AM', arrivals: 12, served: 8 },
    { time: '09 AM', arrivals: 24, served: 18 },
    { time: '10 AM', arrivals: 38, served: 30 },
    { time: '11 AM', arrivals: 45, served: 40 },
    { time: '12 PM', arrivals: 32, served: 35 },
    { time: '01 PM', arrivals: 20, served: 25 },
    { time: '02 PM', arrivals: 36, served: 32 },
    { time: '03 PM', arrivals: 42, served: 38 },
    { time: '04 PM', arrivals: 28, served: 30 },
    { time: '05 PM', arrivals: 16, served: 20 },
  ];

  // Department Distribution Data
  const deptData = [
    { name: 'Cardiology', count: 34, color: 'from-cyan-500 to-blue-600', percentage: 35 },
    { name: 'Emergency Care', count: 28, color: 'from-rose-500 to-amber-500', percentage: 28 },
    { name: 'Pediatrics', count: 18, color: 'from-purple-500 to-indigo-500', percentage: 18 },
    { name: 'Neurology', count: 12, color: 'from-emerald-500 to-teal-500', percentage: 12 },
    { name: 'Orthopedics', count: 7, color: 'from-slate-500 to-slate-400', percentage: 7 },
  ];

  const maxArrivals = Math.max(...hourlyData.map((d) => d.arrivals));

  // Compute SVG Area Chart Points
  const chartWidth = 600;
  const chartHeight = 180;
  const padding = 20;

  const getX = (index) => padding + (index / (hourlyData.length - 1)) * (chartWidth - padding * 2);
  const getY = (value) => chartHeight - padding - (value / maxArrivals) * (chartHeight - padding * 2);

  const pointsArrivals = hourlyData.map((d, i) => `${getX(i)},${getY(d.arrivals)}`).join(' ');
  const pointsServed = hourlyData.map((d, i) => `${getX(i)},${getY(d.served)}`).join(' ');

  const areaArrivals = `${getX(0)},${chartHeight - padding} ${pointsArrivals} ${getX(hourlyData.length - 1)},${chartHeight - padding}`;
  const areaServed = `${getX(0)},${chartHeight - padding} ${pointsServed} ${getX(hourlyData.length - 1)},${chartHeight - padding}`;

  const totalServed = queueTokens.filter((t) => t.status === 'Completed').length || 18;
  const totalWaiting = queueTokens.filter((t) => t.status === 'Waiting').length || 6;
  const totalServing = queueTokens.filter((t) => t.status === 'Serving').length || 2;
  const totalCancelled = queueTokens.filter((t) => t.status === 'Cancelled').length || 1;
  const grandTotal = totalServed + totalWaiting + totalServing + totalCancelled;

  const completionRate = Math.round((totalServed / grandTotal) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Peak Patient Traffic</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 mt-2">10 AM - 11 AM</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>+24% vs yesterday</span>
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
            <span>Avg Handling Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold text-cyan-400 mt-2">9.4 Mins</p>
          <div className="flex items-center text-[11px] text-emerald-400 mt-1 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>1.8m faster than target</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Staff Load</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-400 mt-2">8 Specialists</p>
          <div className="flex items-center text-[11px] text-slate-400 mt-1">
            <span>Across 5 OPD Departments</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Flow Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Patient Arrival vs Served Volume Flow</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time OPD traffic curve for {hospitalName || 'Facility'}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
                <span className="text-slate-300 text-[11px]">Arrivals</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-slate-300 text-[11px]">Served</span>
              </div>
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
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientServed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
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

              {/* Area Fills */}
              <polygon points={areaArrivals} fill="url(#gradientArrivals)" />
              <polygon points={areaServed} fill="url(#gradientServed)" />

              {/* Curve Lines */}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsArrivals}
              />
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsServed}
              />

              {/* Data Dots */}
              {hourlyData.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={getX(i)}
                    cy={getY(d.arrivals)}
                    r="4"
                    fill="#22d3ee"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                  <circle
                    cx={getX(i)}
                    cy={getY(d.served)}
                    r="4"
                    fill="#34d399"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-500 border-t border-slate-800/80">
              {hourlyData.map((d, i) => (
                <span key={i}>{d.time}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Department Distribution (1 col) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Department Load Distribution</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Patient volume share by specialty</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {deptData.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{dept.name}</span>
                  <span className="text-slate-400 font-mono">{dept.count} patients ({dept.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full bg-gradient-to-r ${dept.color} rounded-full transition-all duration-500`}
                    style={{ width: `${dept.percentage}%` }}
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
