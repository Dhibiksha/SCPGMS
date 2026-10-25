import React, { useState, useEffect } from 'react';
import { Building, Plus } from 'lucide-react';
import api from '../../api';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchDepts();
  }, []);

  const fetchDepts = async () => {
    const res = await api.get('/departments');
    setDepartments(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/departments', { name });
      setName('');
      fetchDepts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create department');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Department Management</h1>
        <p className="text-xs text-slate-400">Manage organizational departments and team leads.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-white">Add New Department</h3>
        <form onSubmit={handleCreate} className="flex space-x-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Department Name"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
          />
          <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl flex items-center space-x-1">
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map(d => (
          <div key={d.id} className="glass-panel p-5 rounded-2xl space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{d.name}</h4>
                <p className="text-xs text-slate-400">{d.employees?.length || 0} Employees Assigned</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
