import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building,
  Award,
  Target,
  CheckSquare,
  AlertOctagon,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/departments', label: 'Departments', icon: Building },
    { to: '/admin/skills', label: 'Skills', icon: Award },
    { to: '/admin/reports', label: 'Analytics Reports', icon: BarChart3 },
    { to: '/admin/audit', label: 'Audit Logs', icon: ShieldCheck }
  ];

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/goals', label: 'Goal Hierarchy', icon: Target },
    { to: '/manager/tasks', label: 'Tasks & Graph', icon: CheckSquare },
    { to: '/manager/team', label: 'Team Workload', icon: Users },
    { to: '/manager/risk', label: 'Goal Risk Monitor', icon: AlertOctagon },
    { to: '/manager/recommendations', label: 'Adaptive Recommendations', icon: Sparkles },
    { to: '/manager/reports', label: 'Team Reports', icon: BarChart3 }
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/employee/goals', label: 'My Goals', icon: Target },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/employee/workload', label: 'Workload Breakdown', icon: Zap },
    { to: '/employee/productivity', label: 'Productivity Analytics', icon: TrendingUp }
  ];

  const links = role === 'ADMIN' ? adminLinks : role === 'MANAGER' ? managerLinks : employeeLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Navigation ({role})
          </h2>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-lg shadow-sky-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-400 text-center">
        <p className="font-semibold text-slate-300">SCPGMS Engine v1.0</p>
        <span className="text-[10px] text-emerald-400 font-mono">Closed-Loop Intelligence Active</span>
      </div>
    </aside>
  );
}
