import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle, XCircle, ShieldCheck, UserCheck } from 'lucide-react';
import api from '../api';

export default function RecommendationCard({ recommendation, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!recommendation) return null;

  let reasonObj = {};
  try {
    reasonObj = typeof recommendation.reasonJson === 'string'
      ? JSON.parse(recommendation.reasonJson || '{}')
      : (recommendation.reasonJson || {});
  } catch (err) {
    console.error('Failed to parse recommendation reasonJson:', err);
  }
  const reasonsList = Array.isArray(reasonObj?.reasons) ? reasonObj.reasons : [];

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/recommendations/${recommendation.id}/accept`);
      setResult(res.data);
      if (onActionComplete) onActionComplete(res.data);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to accept recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await api.post(`/recommendations/${recommendation.id}/reject`);
      if (onActionComplete) onActionComplete(null);
    } catch (e) {
      alert('Failed to reject recommendation');
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = recommendation.status === 'ACCEPTED' || result?.success;

  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
      isAccepted 
        ? 'bg-emerald-950/20 border-emerald-500/30' 
        : 'glass-panel hover:border-sky-500/40'
    } space-y-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">{reasonObj.summary || 'Task Redistribution Recommended'}</h4>
            <p className="text-xs text-sky-400">Target: {recommendation.targetEmployee?.name || 'Candidate Employee'}</p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
          isAccepted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {isAccepted ? 'ACCEPTED & EXECUTED' : 'ACTION REQUIRED'}
        </span>
      </div>

      {/* Task & TransferDetails */}
      {recommendation.task && (
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[10px]">Target Task</span>
            <span className="font-semibold text-slate-200">{recommendation.task.title}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <span>{recommendation.task.assignedEmployee?.name || 'Current Assignee'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-emerald-400">{recommendation.targetEmployee?.name}</span>
          </div>
        </div>
      )}

      {/* Decision Rationale */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Intelligence Core Rationale:</p>
        <ul className="space-y-1 text-xs text-slate-300">
          {reasonsList.map((r, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <span className="text-sky-400 font-bold">•</span>
              <span>{typeof r === 'string' ? r : JSON.stringify(r)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      {!isAccepted && (
        <div className="pt-2 flex items-center space-x-3">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Executing Redistribution...' : 'Accept Redistribution'}</span>
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center space-x-1"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Reject</span>
          </button>
        </div>
      )}

      {/* Closed Loop Outcome Feedback Banner */}
      {result && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-emerald-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Task Redistribution Completed & Recalculated!</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            Outcome Result: <strong className="text-emerald-400">{result.outcome}</strong>. Workloads and goal risk scores updated live in database.
          </p>
        </div>
      )}
    </div>
  );
}
