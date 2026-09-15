import React, { useState } from 'react';
import { Ticket, Building2, Stethoscope, Clock, ShieldCheck, QrCode, Share2, Printer, Check, X, UserCheck, Phone, AlertCircle, Sparkles } from 'lucide-react';

export default function TokenPassModal({ token, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !token) return null;

  const shareUrl = `${window.location.origin}/token/track?id=${token._id || token.tokenNumber}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate SVG QR Code paths deterministically based on token string
  const generateQrDots = (str) => {
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const grid = [];
    for (let r = 0; r < 7; r++) {
      const row = [];
      for (let c = 0; c < 7; c++) {
        const isFilled = ((hash * (r + 1) * (c + 1)) % 3) !== 0;
        row.push(isFilled);
      }
      grid.push(row);
    }
    return grid;
  };

  const qrGrid = generateQrDots(token.tokenNumber || 'SMART-QUEUE-PASS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0d1b36] to-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Bar */}
        <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Digital OPD Pass</h3>
              <p className="text-[11px] text-cyan-400 font-mono">VERIFIED SMART-QUEUE TOKEN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Pass Container */}
        <div className="space-y-5 relative z-10 print:bg-white print:text-black">
          
          {/* Main Ticket Card Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-inner">
            
            {/* Hospital & Department info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {token.department || 'General Medicine'} Dept
                </span>
                <h4 className="text-lg font-extrabold text-white mt-1.5">{token.hospitalName}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Code: <span className="font-mono text-slate-300">{token.hospitalCode}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ● ACTIVE
                </span>
              </div>
            </div>

            {/* Big Token Number Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-cyan-950 border border-cyan-500/30 rounded-xl p-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Your Token Number</div>
              <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-300 tracking-wider my-1 drop-shadow-md">
                {token.tokenNumber}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2 mt-1">
                <span>Rank Position: <strong className="text-white font-mono">#{token.queuePosition}</strong></span>
                <span>•</span>
                <span>Est Wait: <strong className="text-cyan-300 font-mono">~{token.estimatedWaitMinutes}m</strong></span>
              </div>
            </div>

            {/* Patient & QR Code Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              
              {/* Patient Info */}
              <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Patient Name</div>
                  <div className="text-xs font-bold text-slate-200 truncate">{token.patientName || token.username || 'Registered Patient'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Issued At</div>
                  <div className="text-[11px] font-mono text-slate-300">{new Date(token.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {token.smsPhoneNumber && (
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">SMS Alert To</div>
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {token.smsPhoneNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Verification Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1">
                <div className="w-16 h-16 bg-white p-1 rounded-lg shadow-md flex items-center justify-center">
                  {/* Custom Simulated QR Grid */}
                  <div className="grid grid-cols-7 gap-0.5 w-full h-full">
                    {qrGrid.map((row, rIdx) =>
                      row.map((cell, cIdx) => (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`w-full h-full rounded-[1px] ${
                            cell ? 'bg-slate-950' : 'bg-white'
                          }`}
                        />
                      ))
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-400 font-semibold tracking-wider uppercase">Scan OPD Verification</span>
              </div>

            </div>

            {/* Barcode Strip */}
            <div className="bg-white/90 p-2 rounded-lg text-center overflow-hidden">
              <div className="h-6 flex items-center justify-center gap-1 opacity-90">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${
                      i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <div className="text-[9px] font-mono text-slate-800 font-bold tracking-widest mt-0.5">
                *{token.tokenNumber}*
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? 'Link Copied!' : 'Share Live Tracker'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Pass</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
