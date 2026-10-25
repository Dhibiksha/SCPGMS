import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSkills from './pages/admin/AdminSkills';
import AdminReports from './pages/admin/AdminReports';
import AdminAudit from './pages/admin/AdminAudit';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerGoals from './pages/manager/ManagerGoals';
import ManagerTasks from './pages/manager/ManagerTasks';
import ManagerTeam from './pages/manager/ManagerTeam';
import ManagerRisk from './pages/manager/ManagerRisk';
import ManagerRecommendations from './pages/manager/ManagerRecommendations';
import ManagerReports from './pages/manager/ManagerReports';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeGoals from './pages/employee/EmployeeGoals';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import EmployeeWorkload from './pages/employee/EmployeeWorkload';
import EmployeeProductivity from './pages/employee/EmployeeProductivity';

function ProtectedLayout({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sky-400 font-bold text-sm">
        Initializing SCPGMS Engine...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard if unauthorized for this path
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedLayout allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<AdminEmployees />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/skills" element={<AdminSkills />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/audit" element={<AdminAudit />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<ProtectedLayout allowedRoles={['MANAGER', 'ADMIN']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/goals" element={<ManagerGoals />} />
            <Route path="/manager/tasks" element={<ManagerTasks />} />
            <Route path="/manager/team" element={<ManagerTeam />} />
            <Route path="/manager/risk" element={<ManagerRisk />} />
            <Route path="/manager/recommendations" element={<ManagerRecommendations />} />
            <Route path="/manager/reports" element={<ManagerReports />} />
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedLayout allowedRoles={['EMPLOYEE', 'MANAGER', 'ADMIN']} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/goals" element={<EmployeeGoals />} />
            <Route path="/employee/tasks" element={<EmployeeTasks />} />
            <Route path="/employee/workload" element={<EmployeeWorkload />} />
            <Route path="/employee/productivity" element={<EmployeeProductivity />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
