import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Zap } from 'lucide-react';
import api from '../../api';
import WorkloadBreakdown from '../../components/WorkloadBreakdown';

export default function EmployeeWorkload() {
  const { user } = useAuth();
  const empId = user?.employeeId;
  const [workload, setWorkload] = useState(null);

  useEffect(() => {
    if (empId) fetchWorkload();
  }, [empId]);

  const fetchWorkload = async () => {
    const res = await api.get(`/employees/${empId}/workload`);
    setWorkload(res.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Personal Workload Factor Analysis</h1>
        <p className="text-xs text-slate-400">Detailed breakdown of how your active tasks, deadlines, effort, and historical delays calculate your score.</p>
      </div>

      {workload && <WorkloadBreakdown workload={workload} />}
    </div>
  );
}
