import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import api from '../../api';
import RecommendationCard from '../../components/RecommendationCard';

export default function ManagerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/recommendations');
      setRecommendations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch recommendations error:', e);
      setRecommendations([]);
    }
  };

  const handleTrigger = async () => {
    setLoading(true);
    try {
      await api.post('/recommendations/trigger');
      fetchRecommendations();
    } catch (e) {
      alert('Failed to trigger recommendation engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Adaptive Recommendation & Redistribution</h1>
          <p className="text-xs text-slate-400">Review intelligent recommendations matched by skills, capacity, workload, and risk position.</p>
        </div>

        <button
          onClick={handleTrigger}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center space-x-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Trigger Engine Evaluation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map(rec => (
          <RecommendationCard key={rec.id} recommendation={rec} onActionComplete={fetchRecommendations} />
        ))}
      </div>
    </div>
  );
}
