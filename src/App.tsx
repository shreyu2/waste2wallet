import { Routes, Route, Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import { useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage.tsx';
import RoleSelectionPage from './pages/RoleSelectionPage.tsx';
import RewardsPage from './pages/RewardsPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import AuthPage from './pages/AuthPage.tsx';
import CollectorScreen from './pages/CollectorScreen.tsx';
import CollectorPortfolio from './pages/CollectorPortfolio.tsx';
import CitizenDashboard from './pages/CitizenDashboard.tsx';
import CitizenPortfolio from './pages/CitizenPortfolio.tsx';
import STPDashboard from './pages/STPDashboard.tsx';
import Layout from './components/Layout';

function PrivateRoute({ children, role }: { children: ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<RoleSelectionPage />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<Layout />}>
        <Route path="/admin" element={
          <PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>
        } />
        <Route path="/collector" element={
          <PrivateRoute role="COLLECTOR"><CollectorScreen /></PrivateRoute>
        } />
        <Route path="/collector/portfolio" element={
          <PrivateRoute role="COLLECTOR"><CollectorPortfolio /></PrivateRoute>
        } />
        <Route path="/citizen" element={
          <PrivateRoute role="CITIZEN"><CitizenDashboard /></PrivateRoute>
        } />
        <Route path="/citizen/portfolio" element={
          <PrivateRoute role="CITIZEN"><CitizenPortfolio /></PrivateRoute>
        } />
        <Route path="/stp-health" element={
          <PrivateRoute><STPDashboard /></PrivateRoute>
        } />
        <Route path="/rewards" element={
          <PrivateRoute><RewardsPage /></PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
