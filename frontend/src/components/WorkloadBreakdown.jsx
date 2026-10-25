import React from 'react';
import { Activity, Clock, AlertTriangle, Layers, TrendingUp, CheckCircle, ShieldAlert } from 'lucide-react';

export default function WorkloadBreakdown({ workload }) {
  if (!workload) return null;

  const { score = 0, state = 'LOW', factors = {} } = workload;

  const stateColors = {
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MODERATE: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
  };

  const factorItems = [
    { label: 'Active Tasks Count', val: factors.activeTaskFactor || 0, icon: Layers, desc: `${workload.activeTasksCount || 0} active tasks assigned` },
    { label: 'Task Priority Weight', val: factors.priorityFactor || 0, icon: AlertTriangle, desc: 'Average priority severity' },
    { label: 'Task Complexity Weight', val: factors.complexityFactor || 0, icon: Activity, desc: 'Technical complexity ratio' },
    { label: 'Effort / Capacity Ratio', val: factors.effortCapacityFactor || 0, icon: Clock, desc: `${factors.totalRemainingEffortHours || 0}h effort vs ${factors.employeeCapacityHours || 40}h capacity` },
    { label: 'Deadline Proximity', val: factors.deadlineFactor || 0, icon: Clock, desc: 'Tasks approaching due dates' },
    { label: 'Dependency Load', val: factors.dependencyFactor || 0, icon: Layers, desc: 'Blocking/blocked task dependencies' },
    { label: 'Remaining Progress', val: factors.remainingProgressFactor || 0, icon: TrendingUp, desc: 'Uncompleted percentage' },
    { label: 'Historical Delay Factor', val: factors.historicalDelayFactor || 0, icon: ShieldAlert, desc: 'Past deadline slip ratio' }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>Employee Workload Core</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">{factors.explanation || 'Multi-factor workload evaluation.'}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-3xl font-extrabold text-white">{score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${stateColors[state] || stateColors.LOW}`}>
            {state}
          </span>
        </div>
      </div>

      {/* 8 Contributing Factors Bar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {factorItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-300 font-medium">
                  <Icon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{item.label}</span>
                </div>
                <span className="font-bold text-sky-400">{item.val}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.val > 80 ? 'bg-rose-500' : item.val > 60 ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, item.val))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
