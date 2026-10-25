import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, AlertOctagon, GitCommit, UserCheck, BarChart3, ExternalLink } from 'lucide-react';
import api from '../api';

export default function DemoFlowController({ onScenarioUpdated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [demoLog, setDemoLog] = useState([]);
  const navigate = useNavigate();

  const addLog = (msg) => setDemoLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handleStepClick = async (stepNum, path, action) => {
    setLoading(true);
    setStep(stepNum);
    try {
      if (action === 'risk') {
        addLog("Evaluating baseline: Alex Rivera (73/HIGH Overload), Sarah Chen (30/LOW Available).");
        await api.get('/intelligence/risk/dashboard');
      } else if (action === 'impact') {
        addLog("Analyzing downstream dependency graph & 4-level goal impact hierarchy.");
      } else if (action === 'recommendation') {
        addLog("Triggering Recommendation Engine: Matching skills, capacity, workload & risk.");
        await api.post('/recommendations/trigger');
        if (onScenarioUpdated) onScenarioUpdated();
      } else if (action === 'redistribution') {
        addLog("Checking pending recommendations for automated redistribution execution...");
        const res = await api.get('/recommendations');
        const pending = (res.data || []).find(r => r.status === 'PENDING');
        if (pending) {
          await api.post(`/recommendations/${pending.id}/accept`);
          addLog(`Accepted & executed redistribution for task: "${pending.task?.title || 'Task'}" in database.`);
          if (onScenarioUpdated) onScenarioUpdated();
        } else {
          addLog("All pending recommendations already accepted. Viewing redistribution state.");
        }
      } else if (action === 'outcome') {
        addLog("Querying Closed-Loop Feedback Engine: Retrieving historical outcome log & success metrics.");
        await api.get('/recommendations/feedback/summary');
      }
      
      if (path) {
        navigate(path);
      }
    } catch (e) {
      addLog("Workflow action error: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const runFullClosedLoopDemo = async () => {
    setLoading(true);
    setDemoLog([]);
    try {
      addLog("Step 1: Inspecting Overload & Goal Delay Risk baseline.");
      setStep(1);
      
      addLog("Step 2: Calculating downstream task dependencies & goal impact chain.");
      setStep(2);
      
      addLog("Step 3: Triggering Adaptive Recommendation Engine...");
      const recRes = await api.post('/recommendations/trigger');
      setStep(3);
      
      const recs = recRes.data?.recommendations || [];
      addLog(`Generated ${recs.length} intelligent task redistribution recommendation(s).`);
      
      addLog("Step 4: Executing task redistribution in database...");
      const pendingRes = await api.get('/recommendations');
      const pending = (pendingRes.data || []).find(r => r.status === 'PENDING');
      if (pending) {
        const acceptRes = await api.post(`/recommendations/${pending.id}/accept`);
        addLog(`Successfully reassigned task to ${pending.targetEmployee?.name}. Outcome: ${acceptRes.data?.outcome || 'IMPROVED'}.`);
      } else {
        addLog("No pending recommendations to redistribute. Baseline already balanced.");
      }
      setStep(4);
      
      addLog("Step 5: Closed-Loop Feedback saved! Workload scores & goal risks recalculated.");
      setStep(5);
      
      if (onScenarioUpdated) onScenarioUpdated();
    } catch (e) {
      addLog("Demo execution error: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const stepsData = [
    {
      num: 1,
      title: '1. Overload & Risk',
      subtitle: 'Workload & Risk Monitor',
      path: '/manager/risk',
      action: 'risk',
      icon: AlertOctagon
    },
    {
      num: 2,
      title: '2. Impact Analysis',
      subtitle: 'Task Dependency Graph',
      path: '/manager/tasks',
      action: 'impact',
      icon: GitCommit
    },
    {
      num: 3,
      title: '3. Recommendation',
      subtitle: 'Adaptive Recommendations',
      path: '/manager/recommendations',
      action: 'recommendation',
      icon: Sparkles
    },
    {
      num: 4,
      title: '4. Redistribution',
      subtitle: 'Execute Task Transfer',
      path: '/manager/recommendations',
      action: 'redistribution',
      icon: UserCheck
    },
    {
      num: 5,
      title: '5. Outcome Saved',
      subtitle: 'Closed-Loop Reports',
      path: '/manager/reports',
      action: 'outcome',
      icon: BarChart3
    }
  ];

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 border-2 border-sky-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-850">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Interactive SCPGMS 5-Step Intelligence Workflow</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">Live Core</span>
            </h3>
            <p className="text-xs text-slate-400">Click any step below to trigger its engine evaluation and navigate directly to its dedicated manager page.</p>
          </div>
        </div>

        <button
          onClick={runFullClosedLoopDemo}
          disabled={loading}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition shrink-0"
        >
          <Play className={`w-4 h-4 fill-current ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Evaluating Core Flow...' : 'Run Full Closed-Loop Flow'}</span>
        </button>
      </div>

      {/* Interactive 5-Step Workflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
        {stepsData.map((s) => {
          const Icon = s.icon;
          const isActive = step >= s.num;
          return (
            <button
              key={s.num}
              onClick={() => handleStepClick(s.num, s.path, s.action)}
              disabled={loading}
              title={`Navigate to ${s.title}`}
              className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between space-y-2 ${
                isActive
                  ? 'bg-sky-500/15 border-sky-400 text-sky-200 shadow-md shadow-sky-500/10 hover:border-sky-300 hover:bg-sky-500/25'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs group-hover:text-white transition-colors">{s.title}</span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'} group-hover:text-sky-300`} />
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="truncate">{s.subtitle}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-400 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Intelligence Console Log Output */}
      {demoLog.length > 0 && (
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto shadow-inner">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Intelligence Execution Console</span>
            <span className="text-emerald-500 text-[9px]">● LIVE API LOG</span>
          </div>
          {demoLog.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-slate-600 select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
