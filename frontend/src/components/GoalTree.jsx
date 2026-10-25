import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Target, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

export default function GoalTree({ goals = [] }) {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Target className="w-5 h-5 text-sky-400" />
          <span>Organizational Goal Hierarchy</span>
        </h3>
        <span className="text-xs text-slate-400">Corporate &rarr; Department &rarr; Team &rarr; Milestone &rarr; Task</span>
      </div>

      <div className="space-y-3">
        {goals.map(goal => (
          <GoalTreeNode key={goal.id} goal={goal} level={0} />
        ))}
      </div>
    </div>
  );
}

function GoalTreeNode({ goal, level }) {
  const [expanded, setExpanded] = useState(true);

  const levelBadges = {
    Corporate: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Department: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    Team: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    Employee: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  };

  const hasChildren = (goal.childGoals && goal.childGoals.length > 0) || (goal.milestones && goal.milestones.length > 0);

  return (
    <div className="space-y-2">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl cursor-pointer transition"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center space-x-3">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <div className="w-4" />
          )}

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${levelBadges[goal.level] || levelBadges.Corporate}`}>
            {goal.level}
          </span>

          <span className="font-semibold text-sm text-slate-100">{goal.title}</span>
        </div>

        <div className="flex items-center space-x-3">
          {goal.status === 'AT_RISK' && (
            <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-bold flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>AT RISK</span>
            </span>
          )}
          <span className="text-xs text-slate-400">
            Due: {new Date(goal.deadline).toLocaleDateString()}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2">
          {/* Child Goals */}
          {goal.childGoals && goal.childGoals.map(child => (
            <GoalTreeNode key={child.id} goal={child} level={level + 1} />
          ))}

          {/* Milestones */}
          {goal.milestones && goal.milestones.map(m => (
            <div 
              key={m.id} 
              className="bg-slate-850/60 border border-slate-800/80 p-3 rounded-xl ml-8 space-y-2"
              style={{ marginLeft: `${(level + 1) * 24}px` }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-sky-300 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Milestone: {m.title}</span>
                </span>
                <span className="text-slate-400">Due: {new Date(m.deadline).toLocaleDateString()}</span>
              </div>

              {/* Tasks under milestone */}
              {m.tasks && m.tasks.length > 0 && (
                <div className="pl-4 space-y-1.5 border-l-2 border-slate-700 mt-2">
                  {m.tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          t.status === 'COMPLETED' ? 'bg-emerald-400' :
                          t.status === 'DELAYED' ? 'bg-rose-400' :
                          t.status === 'BLOCKED' ? 'bg-amber-400' : 'bg-sky-400'
                        }`} />
                        <span className="text-slate-200 font-medium">{t.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({t.priority})</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px]">
                        <span className="text-slate-400">{t.assignedEmployee?.name || 'Unassigned'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                          t.status === 'DELAYED' ? 'bg-rose-500/20 text-rose-400' :
                          t.status === 'BLOCKED' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
