import React from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, Info, X } from 'lucide-react';

export default function NotificationCenter({ notifications, onMarkAsRead, onClearAll, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl border border-slate-700/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-sm text-slate-100">Notifications</h3>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-500/30">
              {notifications.filter(n => !n.read).length} new
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-700/50 text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No new notifications</p>
            <p className="text-[11px] text-slate-500 mt-1">Updates about your queue tokens will appear here.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                !n.read ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'hover:bg-slate-800/20 opacity-75'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {n.type === 'status' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : n.type === 'alert' ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-200 truncate">{n.title}</p>
                  <span className="text-[10px] text-slate-500 flex items-center">
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    {n.time}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
              </div>
              {!n.read && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
