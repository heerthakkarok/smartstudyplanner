import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User, Calendar, CheckSquare, LayoutDashboard, Brain } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Main navigation links - REMOVED separate Profile item as requested
  const navLinks = [
    { path: '/landing', label: 'Home', icon: BookOpen },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/study-plan', label: 'Study Plan', icon: Calendar },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/quiz', label: 'AI Quiz', icon: Brain },
  ];

  const isProfileActive = location.pathname === '/profile';

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Smart Study Planner
            </span>
          </Link>

          {/* Center Navigation Links */}
          {isAuthenticated && user?.isOnboarded && (
            <div className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Section (Right Side) */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {/* Primary Profile Access Point: User Name Button */}
              <Link
                to="/profile"
                className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border shadow-sm ${
                  isProfileActive
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-blue-500/10'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60 hover:border-blue-500/40 hover:text-white'
                }`}
                title="View & Edit Profile"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover border border-blue-400"
                  />
                ) : (
                  <User className="w-4 h-4 text-blue-400" />
                )}
                <span className="font-semibold">{user?.name || 'User Profile'}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-md shadow-blue-600/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
