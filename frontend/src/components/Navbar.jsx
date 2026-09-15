import React, { useState } from 'react';
import {
  Activity,
  Hospital,
  History,
  UserCheck,
  ShieldAlert,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Check
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  userRole,
  setUserRole,
  notifications,
  onMarkAsRead,
  onClearAll,
  soundMuted,
  onToggleSound,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels = {
    patient: { label: 'Patient View', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    staff: { label: 'Hospital Staff', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    admin: { label: 'System Admin', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('hospitals')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center glow-blue shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SmartQueue
              </span>
              <span className="text-xs text-cyan-400 block -mt-1 font-medium tracking-wide">
                HEALTH TRACKER
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'hospitals'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Hospital className="w-3.5 h-3.5" />
              <span>Hospitals</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>My Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'doctors'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Doctors</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Staff Portal</span>
            </button>
          </nav>

          {/* Right Action Icons & User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all hover:text-cyan-400"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onClearAll={onClearAll}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                soundMuted={soundMuted}
                onToggleSound={onToggleSound}
              />
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  roleLabels[userRole]?.color || roleLabels.patient.color
                }`}
              >
                <span>{roleLabels[userRole]?.label || 'Patient View'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 top-12 w-48 glass-panel rounded-xl border border-slate-700/60 shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Switch Workspace Role
                  </div>
                  {Object.entries(roleLabels).map(([roleKey, roleObj]) => (
                    <button
                      key={roleKey}
                      onClick={() => {
                        setUserRole(roleKey);
                        setShowRoleDropdown(false);
                        if (roleKey === 'staff' || roleKey === 'admin') {
                          setActiveTab('staff');
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-xs flex items-center justify-between text-slate-200 hover:bg-slate-800/80 transition-colors"
                    >
                      <span>{roleObj.label}</span>
                      {userRole === roleKey && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 font-bold text-xs">
                  {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-slate-200 truncate max-w-[100px]">
                  {user?.username || 'User'}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${
              activeTab === 'hospitals' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <Hospital className="w-3.5 h-3.5" />
            <span>Hospitals</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${
              activeTab === 'history' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${
              activeTab === 'doctors' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Doctors</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${
              activeTab === 'staff' ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </button>
        </div>
      </div>
    </header>
  );
}
