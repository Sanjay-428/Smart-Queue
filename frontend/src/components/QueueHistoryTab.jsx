import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Download,
  Printer,
  X,
  QrCode,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import api from '../api/axios';

export default function QueueHistoryTab({ onSelectActiveToken }) {
  const [historyTokens, setHistoryTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTokenModal, setSelectedTokenModal] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/queue/history');
      if (response.data.success) {
        setHistoryTokens(response.data.data);
      }
    } catch (err) {
      console.error('Error loading queue history:', err);
      setError('Could not fetch queue history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredTokens = historyTokens.filter((t) => {
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' ? ['Waiting', 'Serving'].includes(t.status) : t.status === statusFilter);

    const matchesSearch =
      t.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalCount = historyTokens.length;
  const activeCount = historyTokens.filter((t) => ['Waiting', 'Serving'].includes(t.status)).length;
  const completedCount = historyTokens.filter((t) => t.status === 'Completed').length;
  const cancelledCount = historyTokens.filter((t) => t.status === 'Cancelled').length;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <span>Virtual Queue Ticket History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track all your active tokens, past visits, and download digital entry receipts.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
        >
          Refresh History
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Enrolled</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{totalCount}</p>
          <span className="text-[11px] text-slate-500">Lifetime queue tokens</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Tickets</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-500">Currently in line</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{completedCount}</p>
          <span className="text-[11px] text-slate-500">Visits fulfilled</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{cancelledCount}</p>
          <span className="text-[11px] text-slate-500">Cancelled by user</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search token #, hospital or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['All', 'Active', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading queue ticket history...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40 text-xs">
          {error}
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl border border-slate-800">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-200">No Queue Tokens Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't joined any virtual hospital queue matching this filter yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.map((token) => {
            const isWaiting = token.status === 'Waiting';
            const isServing = token.status === 'Serving';
            const isCompleted = token.status === 'Completed';
            const isCancelled = token.status === 'Cancelled';

            return (
              <div
                key={token._id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                      {token.tokenNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isServing
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                          : isWaiting
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : isCompleted
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {token.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{token.hospitalName}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block mr-2" />
                    Department: <strong className="text-slate-200 ml-1">{token.department}</strong>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="block text-slate-500">Issued On</span>
                      <span className="text-slate-300 font-medium flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                        {new Date(token.createdAt || token.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Est. Wait Time</span>
                      <span className="text-slate-300 font-medium flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        {token.estimatedWaitMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedTokenModal(token)}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Digital Pass / Receipt</span>
                  </button>

                  {(isWaiting || isServing) && onSelectActiveToken && (
                    <button
                      onClick={() => onSelectActiveToken(token)}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium border border-cyan-500/30 transition-colors"
                    >
                      Live Tracker →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Receipt Modal */}
      {selectedTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Ticket Top Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white relative">
              <button
                onClick={() => setSelectedTokenModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2 text-cyan-200 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Virtual Queue Entry Ticket</span>
              </div>
              <h3 className="text-xl font-extrabold mt-1">{selectedTokenModal.hospitalName}</h3>
              <p className="text-xs text-cyan-100/80 mt-0.5">{selectedTokenModal.department} Department</p>
            </div>

            {/* Ticket Main Body */}
            <div className="p-6 space-y-5 bg-slate-900">
              <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Queue Ticket Number
                </span>
                <p className="text-3xl font-extrabold font-mono text-cyan-400 tracking-wider mt-1">
                  {selectedTokenModal.tokenNumber}
                </p>
                <span
                  className={`inline-block mt-2 text-xs font-semibold px-3 py-0.5 rounded-full ${
                    selectedTokenModal.status === 'Serving'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : selectedTokenModal.status === 'Waiting'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Status: {selectedTokenModal.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Patient Name</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                    {selectedTokenModal.username}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Hospital Code</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {selectedTokenModal.hospitalCode}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Queue Position</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    #{selectedTokenModal.queuePosition}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Issued Time</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {new Date(selectedTokenModal.createdAt || selectedTokenModal.joinedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Barcode & QR Code simulation */}
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500">Scan at hospital check-in kiosk</p>
                  {/* Barcode lines */}
                  <div className="flex items-center space-x-1 mt-2">
                    {[3, 1, 4, 2, 5, 2, 4, 1, 3, 2, 5, 1, 3, 4, 2].map((w, i) => (
                      <div
                        key={i}
                        className="bg-slate-300 h-8"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-14 h-14 bg-white p-1 rounded-xl flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
              </div>
            </div>

            {/* Ticket Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 flex items-center space-x-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>

              <button
                onClick={() => setSelectedTokenModal(null)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
