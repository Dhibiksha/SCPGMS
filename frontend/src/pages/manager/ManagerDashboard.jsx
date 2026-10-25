import React, { useState, useEffect } from 'react';
import { Target, CheckSquare, AlertOctagon, Sparkles, Users, TrendingUp } from 'lucide-react';
import api from '../../api';
import DemoFlowController from '../../components/DemoFlowController';
import RecommendationCard from '../../components/RecommendationCard';
import RiskReasonList from '../../components/RiskReasonList';
import GoalTree from '../../components/GoalTree';

export default function ManagerDashboard() {
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [riskDashboard, setRiskDashboard] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [gRes, tRes, wlRes, rRes, riskRes, fbRes] = await Promise.all([
        api.get('/goals/hierarchy'),
        api.get('/tasks'),
        api.get('/intelligence/workload/team'),
        api.get('/recommendations'),
        api.get('/intelligence/risk/dashboard'),
        api.get('/recommendations/feedback/summary')
      ]);

      setGoals(gRes.data);
      setTasks(tRes.data);
      setTeamWorkload(wlRes.data);
      setRecommendations(rRes.data);
      setRiskDashboard(riskRes.data);
      setFeedbackSummary(fbRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const highRiskGoals = (Array.isArray(riskDashboard) ? riskDashboard : []).filter(r => r && (r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM'));
  const pendingRecommendations = (Array.isArray(recommendations) ? recommendations : []).filter(r => r && r.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Manager Productivity & Risk Dashboard</h1>
        <p className="text-xs text-slate-400">Monitor department goals, task dependencies, delay risks, and execute adaptive redistributions.</p>
      </div>

      {/* Live Demo Flow Controller Banner */}
      <DemoFlowController onScenarioUpdated={fetchDashboardData} />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Active Team Goals</span>
            <p className="text-2xl font-bold text-white">{goals.length}</p>
          </div>
          <Target className="w-8 h-8 text-sky-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">High-Risk Goals</span>
            <p className="text-2xl font-bold text-amber-400">{highRiskGoals.length}</p>
          </div>
          <AlertOctagon className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Pending Recommendations</span>
            <p className="text-2xl font-bold text-sky-400">{pendingRecommendations.length}</p>
          </div>
          <Sparkles className="w-8 h-8 text-sky-400 opacity-80" />
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Feedback Success Rate</span>
            <p className="text-2xl font-bold text-emerald-400">{feedbackSummary?.successRatePct || 100}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
      </div>

      {/* Actionable Adaptive Recommendations */}
      {pendingRecommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <span>Active Adaptive Task Redistribution Recommendations</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRecommendations.map(rec => (
              <RecommendationCard key={rec.id} recommendation={rec} onActionComplete={fetchDashboardData} />
            ))}
          </div>
        </div>
      )}

      {/* Team Workload Comparison Grid */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-sky-400" />
          <span>Team Workload Monitor</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Array.isArray(teamWorkload) ? teamWorkload : []).map(tw => {
            if (!tw || !tw.employee || !tw.workload) return null;
            const wlState = tw.workload.state || 'LOW';
            const wlScore = tw.workload.score || 0;

            return (
              <div key={tw.employee.id || tw.employee.name} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{tw.employee.name}</h4>
                    <p className="text-[10px] text-slate-400">{tw.employee.designation}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    wlState === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                    wlState === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                  }`}>
                    {wlState} ({wlScore})
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      wlScore >= 85 ? 'bg-rose-500' : wlScore >= 65 ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, wlScore))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal Hierarchy View */}
      <GoalTree goals={goals} />
    </div>
  );
}
