import React, { useState, useEffect } from 'react';
import { Award, Plus } from 'lucide-react';
import api from '../../api';

export default function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    const res = await api.get('/skills');
    setSkills(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/skills', { name });
      setName('');
      fetchSkills();
    } catch (err) {
      alert('Failed to create skill');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Skill Matrix Management</h1>
        <p className="text-xs text-slate-400">Define employee skills used by the Adaptive Recommendation Engine.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4 max-w-md">
        <h3 className="text-sm font-bold text-white">Add New Skill</h3>
        <form onSubmit={handleCreate} className="flex space-x-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Skill Name (e.g. React, PostgreSQL)"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
          />
          <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl flex items-center space-x-1">
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {skills.map(s => (
          <div key={s.id} className="glass-panel p-4 rounded-2xl flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">{s.name}</h4>
              <p className="text-[10px] text-slate-400">{s.employeeSkills?.length || 0} proficient staff</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
