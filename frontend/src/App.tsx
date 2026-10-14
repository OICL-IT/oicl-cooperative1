import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Savings } from './pages/Savings';
import { Loans } from './pages/Loans';
import { Members } from './pages/Members';
import { StaffManagement } from './pages/StaffManagement';
import { AdminLoans } from './pages/AdminLoans';
import { Payroll } from './pages/Payroll';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ActivateMembership } from './pages/ActivateMembership';
import { Register } from './pages/Register';
import { Governance } from './pages/Governance';
import { FinancialStatus } from './pages/FinancialStatus';
import { api } from './lib/api';
import { motion } from 'motion/react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
  <div className="min-h-screen">
      <Sidebar currentPath={window.location.pathname} open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    <div className="min-w-0 lg:pl-64">
      <Header onMenuClick={() => setMobileNavOpen(true)} />
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="mx-auto w-full max-w-360"
        >
          {children}
        </motion.div>
      </main>
    </div>
  </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const u = await api.auth.refreshUser();
      setUser(u);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-emerald-800"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-800" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate-membership" element={<ActivateMembership />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/savings" element={<ProtectedRoute><Savings /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
        <Route path="/admin/loans" element={<ProtectedRoute><AdminLoans /></ProtectedRoute>} />
        <Route path="/admin/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/governance" element={<ProtectedRoute><Governance /></ProtectedRoute>} />
        <Route path="/financial-status" element={<ProtectedRoute><FinancialStatus /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
