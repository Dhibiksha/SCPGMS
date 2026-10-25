import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, Layers, GitCommit, ShieldAlert } from 'lucide-react';
import api from '../api';

export default function DependencyGraph({ tasks = [] }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectTask = async (task) => {
    setSelectedTask(task);
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${task.id}/downstream-impact`);
      setImpactData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-sky-400" />
            <span>Task Dependency & Organizational Impact Core</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Click any task below to evaluate its downstream dependency graph and organizational impact.
          </p>
        </div>
      </div>

      {/* Task Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tasks.map((t) => {
          const isSelected = selectedTask?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTask(t)}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-semibold text-xs text-slate-200 line-clamp-1">{t.title}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  t.status === 'DELAYED' ? 'bg-rose-500/20 text-rose-300' :
                  t.status === 'BLOCKED' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {t.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Assignee: {t.assignedEmployee?.name || 'Unassigned'}</span>
                <span className="font-mono">{t.priority}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Impact Evaluation Result Panel */}
      {selectedTask && (
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-sm text-sky-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Downstream Impact Analysis: "{selectedTask.title}"</span>
            </h4>
            {loading && <span className="text-xs text-slate-400 animate-pulse">Calculating impact...</span>}
          </div>

          {impactData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Downstream Tasks */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blocked / Downstream Tasks</h5>
                {impactData.downstreamTasks.length === 0 ? (
                  <p className="text-xs text-slate-500">No downstream tasks depend on this task.</p>
                ) : (
                  <div className="space-y-2">
                    {impactData.downstreamTasks.map((dt) => (
                      <div key={dt.id} className="flex items-center space-x-3 bg-slate-850 p-2.5 rounded-xl text-xs">
                        <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-200">{dt.title}</p>
                          <p className="text-[10px] text-slate-400">Status: {dt.status} | Priority: {dt.priority}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Organizational Goal Impact Hierarchy */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organizational Impact Chain</h5>
                {impactData.impactChain.length === 0 ? (
                  <p className="text-xs text-slate-500">No organizational goal impact detected.</p>
                ) : (
                  <div className="space-y-2">
                    {impactData.impactChain.map((ic, idx) => (
                      <div key={idx} className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-rose-300">
                          <span>{ic.affectedEntityType}</span>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        </div>
                        <p className="text-slate-300 text-[11px]">{ic.impactDescription}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
