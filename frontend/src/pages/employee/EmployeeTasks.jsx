import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare } from 'lucide-react';
import api from '../../api';

export default function EmployeeTasks() {
  const { user } = useAuth();
  const empId = user?.employeeId;
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (empId) fetchTasks();
  }, [empId]);

  const fetchTasks = async () => {
    const res = await api.get('/tasks');
    const myTasks = res.data.filter(t => t.assignedEmployeeId === empId);
    setTasks(myTasks);
  };

  const handleUpdate = async (id, status, progressPct) => {
    try {
      await api.put(`/tasks/${id}`, { status, progressPct });
      fetchTasks();
    } catch (e) {
      alert('Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Assigned Tasks & Progress</h1>
        <p className="text-xs text-slate-400">Update task progress, log status changes, and manage your backlog.</p>
      </div>

      <div className="space-y-4">
        {tasks.map(t => (
          <div key={t.id} className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-white">{t.title}</h3>
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

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Progress</span>
                <span>{t.progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${t.progressPct}%` }} />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400">Due: {new Date(t.deadline).toLocaleDateString()}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdate(t.id, 'IN_PROGRESS', 50)}
                  className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg text-xs font-bold"
                >
                  Set In Progress
                </button>
                <button
                  onClick={() => handleUpdate(t.id, 'COMPLETED', 100)}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold"
                >
                  Complete Task
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
