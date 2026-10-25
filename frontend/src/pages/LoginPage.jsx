import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, UserCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'MANAGER') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = (eMail) => {
    setEmail(eMail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glow graphics */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl space-y-6 relative z-10 border border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">SCPGMS Portal</h2>
          <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
            Smart Corporate Productivity & Goal System
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. manager@corporate.com"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to SCPGMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Login Helper */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Quick Demo Persona Switcher</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => quickSwitch('admin@corporate.com')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500 text-left transition"
            >
              <div className="font-bold text-slate-200">ADMIN</div>
              <div className="text-[10px] text-slate-400">admin@corporate.com</div>
            </button>

            <button
              onClick={() => quickSwitch('manager@corporate.com')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500 text-left transition"
            >
              <div className="font-bold text-amber-300">MANAGER</div>
              <div className="text-[10px] text-slate-400">manager@corporate.com</div>
            </button>

            <button
              onClick={() => quickSwitch('alex@corporate.com')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500 text-left transition"
            >
              <div className="font-bold text-rose-300">EMPLOYEE A (Overloaded)</div>
              <div className="text-[10px] text-slate-400">alex@corporate.com</div>
            </button>

            <button
              onClick={() => quickSwitch('sarah@corporate.com')}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500 text-left transition"
            >
              <div className="font-bold text-emerald-300">EMPLOYEE B (Available)</div>
              <div className="text-[10px] text-slate-400">sarah@corporate.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
