import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import api from '../../api';
import RiskReasonList from '../../components/RiskReasonList';

export default function ManagerRisk() {
  const [riskDashboard, setRiskDashboard] = useState([]);

  useEffect(() => {
    fetchRiskDashboard();
  }, []);

  const fetchRiskDashboard = async () => {
    try {
      const res = await api.get('/intelligence/risk/dashboard');
      setRiskDashboard(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch risk dashboard error:', e);
      setRiskDashboard([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Goal Delay-Risk Diagnosis & Reasons</h1>
        <p className="text-xs text-slate-400">Rule-based risk engine output with data-grounded explainable reasons.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {riskDashboard.map(r => (
          <div key={r.goalId} className="space-y-3">
            <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">{r.level} Goal</span>
                <h3 className="text-base font-bold text-white">{r.title}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                r.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                r.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {r.riskLevel} ({r.score}/100)
              </span>
            </div>

            <RiskReasonList riskScore={r.score} riskLevel={r.riskLevel} reasons={r.reasons} />
          </div>
        ))}
      </div>
    </div>
  );
}
