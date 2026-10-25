import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, GitCommit } from 'lucide-react';
import api from '../../api';
import DependencyGraph from '../../components/DependencyGraph';

export default function ManagerTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDepModal, setShowDepModal] = useState(false);

  const [taskForm, setTaskForm] = useState({
    milestoneId: '',
    title: '',
    description: '',
    assignedEmployeeId: '',
    priority: 'HIGH',
    complexity: 'HIGH',
    estimatedEffort: 16,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [depForm, setDepForm] = useState({
    taskId: '',
    dependsOnTaskId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, eRes, gRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/employees'),
        api.get('/goals')
      ]);
      setTasks(tRes.data);
      setEmployees(eRes.data);
      setGoals(gRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const milestonesList = goals.flatMap(g => g.milestones || []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', taskForm);
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleAddDependency = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${depForm.taskId}/dependencies`, { dependsOnTaskId: depForm.dependsOnTaskId });
      setShowDepModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add dependency');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Task & Dependency Management</h1>
          <p className="text-xs text-slate-400">Create, assign, set complexity/effort, and manage dependencies to prevent bottlenecks.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDepModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <GitCommit className="w-4 h-4 text-sky-400" />
            <span>Add Dependency</span>
          </button>

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Interactive Dependency Impact Graph Viewer */}
      <DependencyGraph tasks={tasks} />

      {/* Tasks Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Task Title</th>
              <th className="p-4">Assignee</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Complexity</th>
              <th className="p-4">Effort</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-slate-800/40">
                <td className="p-4 font-semibold text-slate-100">{t.title}</td>
                <td className="p-4 text-sky-400 font-bold">{t.assignedEmployee?.name || 'Unassigned'}</td>
                <td className="p-4 font-mono text-amber-400">{t.priority}</td>
                <td className="p-4">{t.complexity}</td>
                <td className="p-4 font-mono">{t.estimatedEffort}h</td>
                <td className="p-4 text-slate-400">{new Date(t.deadline).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.status === 'DELAYED' ? 'bg-rose-500/20 text-rose-400' :
                    t.status === 'BLOCKED' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Target Milestone</label>
                <select
                  value={taskForm.milestoneId}
                  onChange={e => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">Select Milestone</option>
                  {milestonesList.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assign Employee</label>
                <select
                  value={taskForm.assignedEmployeeId}
                  onChange={e => setTaskForm({ ...taskForm, assignedEmployeeId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Complexity</label>
                  <select
                    value={taskForm.complexity}
                    onChange={e => setTaskForm({ ...taskForm, complexity: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Est. Effort (Hours)</label>
                  <input
                    type="number"
                    value={taskForm.estimatedEffort}
                    onChange={e => setTaskForm({ ...taskForm, estimatedEffort: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dependency Modal */}
      {showDepModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Add Task Dependency</h3>
            <form onSubmit={handleAddDependency} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Dependent Task (Task that is blocked)</label>
                <select
                  value={depForm.taskId}
                  onChange={e => setDepForm({ ...depForm, taskId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">Select Task</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Prerequisite Task (Task it depends on)</label>
                <select
                  value={depForm.dependsOnTaskId}
                  onChange={e => setDepForm({ ...depForm, dependsOnTaskId: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  <option value="">Select Prerequisite Task</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDepModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold"
                >
                  Link Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
