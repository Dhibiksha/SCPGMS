import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import api from '../../api';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Audit Logs</h1>
        <p className="text-xs text-slate-400">Immutable record of security events, goal creations, and task redistributions.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                <td className="p-4 text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4 text-sky-400 font-bold">
                  {log.user ? log.user.email : 'SYSTEM'}
                </td>
                <td className="p-4 font-semibold text-slate-200">{log.action}</td>
                <td className="p-4 text-slate-400">{log.entityType} ({log.entityId || 'N/A'})</td>
                <td className="p-4 text-slate-400 max-w-xs truncate">{log.detailsJson}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
