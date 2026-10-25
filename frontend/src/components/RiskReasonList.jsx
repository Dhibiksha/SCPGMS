import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function RiskReasonList({ riskScore = 0, riskLevel = 'LOW', reasons = [] }) {
  const safeReasons = Array.isArray(reasons) ? reasons : [];
  const levelColors = {
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
  };

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-slate-200 text-sm">Goal Delay-Risk Diagnosis</h4>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold text-white">{riskScore} <span className="text-xs text-slate-400">/100</span></span>
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${levelColors[riskLevel] || levelColors.LOW}`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explainable Reasons:</p>
        <div className="space-y-2">
          {safeReasons.length === 0 ? (
            <div className="text-xs text-slate-400 italic">No risk factors detected.</div>
          ) : (
            safeReasons.map((reason, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{typeof reason === 'string' ? reason : JSON.stringify(reason)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
