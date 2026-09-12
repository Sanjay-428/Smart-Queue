import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Clock, Ticket } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleQuickLogin = (roleUser) => {
    setUsername(roleUser);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[#050811]">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Hero Info Banner */}
        <div className="lg:col-span-7 space-y-6 text-left hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide shimmer-badge">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Gen Healthcare OPD Queuing</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Queue Smarter, <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Wait Anywhere.
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
            Real-time virtual tokens, live line position tracking, and estimated wait times for hospitals and outpatient clinics.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Digital Tokens</div>
                <div className="text-[11px] text-slate-400">Instant check-in pass</div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Live Countdown</div>
                <div className="text-[11px] text-slate-400">Smart wait estimation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="lg:col-span-5 w-full">
          {/* Header Branding (Mobile view) */}
          <div className="text-center lg:hidden mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mb-3 glow-cyan">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Smart Queue Tracker</h1>
            <p className="text-slate-400 text-xs mt-1">Real-time Healthcare Queue Engine</p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-xl font-bold text-white">Sign In</h2>
                <p className="text-slate-400 text-xs mt-0.5">Access your queue dashboard</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Phase 1 Ready
              </span>
            </div>

            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="username-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sanjay, doctor, staff"
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 glass-input rounded-xl text-sm placeholder-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="login-submit-btn"
                className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Select Demo Accounts */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Quick Demo Presets:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sanjay')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('doctor')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors text-center cursor-pointer"
                >
                  Staff
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

