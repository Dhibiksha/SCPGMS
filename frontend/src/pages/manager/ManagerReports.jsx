import React, { useState, useEffect } from 'react';
import { BarChart3, ShieldCheck } from 'lucide-react';
import api from '../../api';

export default function ManagerReports() {
  const [feedbackSummary, setFeedbackSummary] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/recommendations/feedback/summary');
      setFeedbackSummary(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Closed-Loop Feedback & Outcome Reports</h1>
        <p className="text-xs text-slate-400">Track task redistribution effectiveness, state changes, and continuous system improvement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Redistributed</span>
          <p className="text-2xl font-bold text-white">{feedbackSummary?.totalEvaluated || 0}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Improved Outcomes</span>
          <p className="text-2xl font-bold text-emerald-400">{feedbackSummary?.improvedCount || 0}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Unchanged Outcomes</span>
          <p className="text-2xl font-bold text-amber-400">{feedbackSummary?.unchangedCount || 0}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <span className="text-xs text-slate-400 uppercase font-semibold">Success Rate</span>
          <p className="text-2xl font-bold text-sky-400">{feedbackSummary?.successRatePct || 100}%</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Historical Recommendation Outcomes Log</span>
        </h3>

        <div className="space-y-3">
          {Array.isArray(feedbackSummary?.recentOutcomes) && feedbackSummary.recentOutcomes.map(o => {
            let prev = {};
            let next = {};
            try {
              prev = typeof o.previousStateJson === 'string' ? JSON.parse(o.previousStateJson || '{}') : (o.previousStateJson || {});
            } catch (e) {
              console.error('Failed to parse previousStateJson:', e);
            }
            try {
              next = typeof o.newStateJson === 'string' ? JSON.parse(o.newStateJson || '{}') : (o.newStateJson || {});
            } catch (e) {
              console.error('Failed to parse newStateJson:', e);
            }

            const formattedDate = o.recordedAt ? new Date(o.recordedAt).toLocaleString() : 'Recent';

            return (
              <div key={o.id || Math.random()} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200">Outcome: {o.outcome || 'RECORDED'}</span>
                  <span className="text-slate-400">{formattedDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-rose-400">Previous State</span>
                    <p>Old Assignee WL Score: {prev?.oldAssigneeWorkloadScore ?? prev?.workloadScore ?? 0}</p>
                    <p>Goal Risk Score: {prev?.goalRiskScore ?? 0}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-emerald-400">New Recalculated State</span>
                    <p>New Assignee WL Score: {next?.newAssigneeWorkloadScore ?? next?.workloadScore ?? 0}</p>
                    <p>Goal Risk Score: {next?.goalRiskScore ?? 0}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
