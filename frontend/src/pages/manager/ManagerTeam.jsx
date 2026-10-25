import React, { useState, useEffect } from 'react';
import { Users, Activity } from 'lucide-react';
import api from '../../api';
import WorkloadBreakdown from '../../components/WorkloadBreakdown';

export default function ManagerTeam() {
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamWorkload();
  }, []);

  const fetchTeamWorkload = async () => {
    setLoading(true);
    try {
      const res = await api.get('/intelligence/workload/team');
      const data = Array.isArray(res.data) ? res.data : [];
      setTeamWorkload(data);
      if (data.length > 0) setSelectedEmp(data[0]);
    } catch (e) {
      console.error('Fetch team workload error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Team Workload Engine Inspection</h1>
        <p className="text-xs text-slate-400">Evaluate employee capacity, active task counts, priority weights, and 8 workload factors.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-sky-400 font-semibold animate-pulse">
          Evaluating team workload factors...
        </div>
      ) : teamWorkload.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          No team workload records available.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamWorkload.map(tw => {
              if (!tw || !tw.employee || !tw.workload) return null;
              const isSelected = selectedEmp?.employee?.id === tw.employee.id;
              const wlState = tw.workload.state || 'LOW';
              const wlScore = tw.workload.score || 0;

              return (
                <button
                  key={tw.employee.id || tw.employee.name}
                  onClick={() => setSelectedEmp(tw)}
                  className={`p-4 rounded-2xl border text-left transition space-y-2 ${
                    isSelected ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-500/30' : 'glass-panel hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-100">{tw.employee.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      wlState === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                      wlState === 'HIGH' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {wlState} ({wlScore})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{tw.employee.designation}</p>
                </button>
              );
            })}
          </div>

          {selectedEmp && selectedEmp.workload && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                Detailed 8-Factor Workload Breakdown: {selectedEmp.employee?.name}
              </h3>
              <WorkloadBreakdown workload={selectedEmp.workload} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
