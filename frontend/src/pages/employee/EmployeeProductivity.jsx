import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, CheckCircle, Clock } from 'lucide-react';
import api from '../../api';

export default function EmployeeProductivity() {
  const { user } = useAuth();
  const empId = user?.employeeId;
  const [productivity, setProductivity] = useState(null);

  useEffect(() => {
    if (empId) fetchProductivity();
  }, [empId]);

  const fetchProductivity = async () => {
    const res = await api.get(`/employees/${empId}/productivity`);
    setProductivity(res.data);
  };

  const factors = productivity?.factors || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Personal Productivity Engine Score</h1>
        <p className="text-xs text-slate-400">Evaluates on-time completion rates, weighted task execution, and workload penalties.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Productivity Performance Rating</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{factors.explanation || 'Performance calculated from active database history.'}</p>
          </div>

          <div className="text-right">
            <span className="text-4xl font-extrabold text-emerald-400">{productivity?.score || 75}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">On-Time Completion Rate</span>
            <p className="text-2xl font-bold text-white">{factors.onTimeRate || 100}%</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Completed Tasks Count</span>
            <p className="text-2xl font-bold text-sky-400">{factors.completedTasksCount || 0}</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-medium">Workload Penalty</span>
            <p className="text-2xl font-bold text-rose-400">-{factors.workloadPenalty || 0} pts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
