import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Target, CheckSquare, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../api';
import WorkloadBreakdown from '../../components/WorkloadBreakdown';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const empId = user?.employeeId;

  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [productivity, setProductivity] = useState(null);

  useEffect(() => {
    if (empId) {
      fetchEmployeeData();
    }
  }, [empId]);

  const fetchEmployeeData = async () => {
    try {
      const [tRes, wRes, pRes] = await Promise.all([
        api.get('/tasks'),
        api.get(`/employees/${empId}/workload`),
        api.get(`/employees/${empId}/productivity`)
      ]);

      const myTasks = tRes.data.filter(t => t.assignedEmployeeId === empId);
      setTasks(myTasks);
      setWorkload(wRes.data);
      setProductivity(pRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus, newProgress) => {
    try {
      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
        progressPct: newProgress
      });
      fetchEmployeeData();
    } catch (e) {
      alert('Failed to update task status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Welcome back, {user?.employee?.name || 'Employee'}</h1>
        <p className="text-xs text-slate-400">Track your assigned tasks, update progress, and inspect your workload and productivity scores.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Assigned Tasks</span>
            <p className="text-2xl font-bold text-white">{tasks.length}</p>
          </div>
          <CheckSquare className="w-8 h-8 text-sky-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">My Workload Score</span>
            <p className="text-2xl font-bold text-amber-400">{workload?.score || 0}/100</p>
          </div>
          <Zap className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Productivity Rating</span>
            <p className="text-2xl font-bold text-emerald-400">{productivity?.score || 75}/100</p>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Workload State</span>
            <p className="text-xl font-bold text-slate-200">{workload?.state || 'LOW'}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-sky-400 opacity-80" />
        </div>
      </div>

      {/* Assigned Tasks & Status Updates */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">My Active Assigned Tasks</h3>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400">No active tasks assigned.</p>
          ) : (
            tasks.map(t => (
              <div key={t.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{t.title}</h4>
                    <p className="text-xs text-slate-400">{t.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.status === 'DELAYED' ? 'bg-rose-500/20 text-rose-400' :
                    t.status === 'BLOCKED' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <div className="flex space-x-4 text-slate-400">
                    <span>Priority: <strong className="text-amber-400">{t.priority}</strong></span>
                    <span>Complexity: <strong>{t.complexity}</strong></span>
                    <span>Deadline: <strong>{new Date(t.deadline).toLocaleDateString()}</strong></span>
                  </div>

                  {/* Inline Status Update buttons */}
                  <div className="flex space-x-2">
                    {t.status !== 'IN_PROGRESS' && t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS', 50)}
                        className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs rounded-lg"
                      >
                        Start Task
                      </button>
                    )}
                    {t.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED', 100)}
                        className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs rounded-lg"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Employee Workload Factor Breakdown */}
      {workload && <WorkloadBreakdown workload={workload} />}
    </div>
  );
}
