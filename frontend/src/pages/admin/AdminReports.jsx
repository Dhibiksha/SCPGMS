import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, AlertOctagon } from 'lucide-react';
import api from '../../api';

export default function AdminReports() {
  const [productivity, setProductivity] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [pRes, wRes, rRes] = await Promise.all([
        api.get('/reports/productivity'),
        api.get('/reports/workload'),
        api.get('/reports/risk')
      ]);
      setProductivity(pRes.data);
      setWorkload(wRes.data);
      setRisk(rRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Analytics Reports</h1>
        <p className="text-xs text-slate-400">Comprehensive real-time reports for productivity, workload, and risk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Productivity Report */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Productivity Ranking</span>
          </h3>
          <div className="space-y-2 text-xs">
            {productivity.map(p => (
              <div key={p.employeeId} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.completedTasks}/{p.totalTasks} tasks completed</p>
                </div>
                <span className="font-bold text-emerald-400">{p.score}/100</span>
              </div>
            ))}
          </div>
        </div>

        {/* Workload Cases Report */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>Critical Workload Cases</span>
          </h3>
          <div className="space-y-2 text-xs">
            {workload?.criticalCases?.map(w => (
              <div key={w.employeeId} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-rose-500/30">
                <div>
                  <p className="font-semibold text-slate-200">{w.name}</p>
                  <p className="text-[10px] text-slate-400">{w.activeTaskCount} active tasks</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  {w.workloadState} ({w.workloadScore})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Report */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>Goal Risk Monitor</span>
          </h3>
          <div className="space-y-2 text-xs">
            {risk?.highRiskGoals?.map(r => (
              <div key={r.goalId} className="bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div className="flex justify-between items-center font-semibold text-slate-200">
                  <span>{r.title}</span>
                  <span className="text-amber-400">{r.riskLevel}</span>
                </div>
                <p className="text-[10px] text-slate-400">{r.delayedTasks} delayed tasks</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
