import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import StudyPlan from './pages/StudyPlan';
import Tasks from './pages/Tasks';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';

const RootRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (!user?.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/landing" element={<Landing ignoreAuthRedirect={true} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes requiring authentication */}
              <Route element={<ProtectedRoute requireOnboarding={false} />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>

              {/* Protected Routes requiring authentication AND onboarding */}
              <Route element={<ProtectedRoute requireOnboarding={true} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/study-plan" element={<StudyPlan />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
