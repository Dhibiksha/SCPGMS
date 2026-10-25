import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import api from '../../api';
import GoalTree from '../../components/GoalTree';

export default function EmployeeGoals() {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals/hierarchy');
      setGoals(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Goals & Organizational Line of Sight</h1>
        <p className="text-xs text-slate-400">View how your daily tasks contribute directly to department and corporate goals.</p>
      </div>

      <GoalTree goals={goals} />
    </div>
  );
}
