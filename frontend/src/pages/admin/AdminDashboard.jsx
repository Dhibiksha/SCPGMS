import React, { useState, useEffect } from 'react';
import { Users, Building, Target, CheckSquare, AlertOctagon, Sparkles, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import api from '../../api';
import WorkloadBreakdown from '../../components/WorkloadBreakdown';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [empRes, deptRes, goalRes, taskRes, wlRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/goals'),
        api.get('/tasks'),
        api.get('/intelligence/workload/team')
      ]);

      setEmployees(empRes.data);
      setDepartments(deptRes.data);
      setGoals(goalRes.data);
      setTasks(taskRes.data);
      setWorkloads(wlRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = workloads.map(w => ({
    name: w.employee.name,
    score: w.workload.score,
    state: w.workload.state
  }));

  const criticalCount = workloads.filter(w => w.workload.state === 'CRITICAL' || w.workload.state === 'HIGH').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Admin Organization Overview</h1>
        <p className="text-xs text-slate-400">System-wide monitoring of employee workload, productivity, and goal risks.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Employees</span>
            <p className="text-2xl font-bold text-white">{employees.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Departments</span>
            <p className="text-2xl font-bold text-white">{departments.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Goals</span>
            <p className="text-2xl font-bold text-white">{goals.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Critical Workloads</span>
            <p className="text-2xl font-bold text-rose-400">{criticalCount}</p>
          </div>
        </div>
      </div>

      {/* Organization Workload Distribution Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Employee Workload Score Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score >= 85 ? '#f43f5e' : entry.score >= 65 ? '#f59e0b' : '#0284c7'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
