import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Brain,
  TrendingUp,
  AlertTriangle,
  Award,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  BarChart3,
  Check,
} from 'lucide-react';

const Landing = ({ ignoreAuthRedirect = false }) => {
  const { user } = useAuth();

  // Redirect authenticated users directly to dashboard unless explicitly viewing /landing
  if (user && !ignoreAuthRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">

      <main className="space-y-24 py-12">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 pt-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-POWERED ADAPTIVE LEARNING</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-none">
            Master Your Exams with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Smart Adaptive Planning
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop worrying about strict, static timetables. Smart Study Planner dynamically adapts to your study speed, quiz mastery, and daily schedule limits.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 text-base flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Planning Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl border border-slate-800 text-base flex items-center justify-center transition-all"
            >
              <span>Existing Student Login</span>
            </Link>
          </div>

          {/* Interactive Hero Preview Graphic */}
          <div className="pt-8 max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-xs font-mono text-slate-500">smartstudyplanner.app/schedule</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-blue-400">Exam Countdown</span>
                  <p className="text-2xl font-bold text-white">24 Days Left</p>
                  <p className="text-xs text-slate-400">Final Term Preparation</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400">Study Mastery</span>
                  <p className="text-2xl font-bold text-white">84% Accuracy</p>
                  <p className="text-xs text-slate-400">Quiz Performance Rating</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-amber-400">Adaptive Redistribution</span>
                  <p className="text-2xl font-bold text-white">"I Fell Behind"</p>
                  <p className="text-xs text-slate-400">1-Click Schedule Balancing</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Ace Your Exams
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Built specifically for ambitious students who need non-overlapping timetables, intelligent quizzes, and adaptive schedule recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Non-Overlapping Schedules</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Algorithmic timetable generation ensuring zero session overlaps, exact start/end minute calculation, and daily study hour caps.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI-Generated Quizzes</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Google Gemini API generates precise multiple-choice quizzes (5, 10, 15, 20 questions) with immediate performance insights.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">"I Fell Behind" Adaptation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Missed study sessions? Click one button to recalculate remaining days, boost weak quiz topics, and view Old vs. New plan side-by-side.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Interactive Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Track your overall completion rate, study streaks, Recharts subject progress bars, and weekly time distribution charts.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-rose-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Multi-Select Time Preferences</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Select any combination of Morning, Afternoon, Evening, and Night slots to fit your exact study rhythm.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4 hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">PDF Export & Monthly Email</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Download a clean, structured PDF timetable anytime or receive automatic monthly performance emails in your inbox.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How Smart Study Planner Works</h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">Get setup in less than 2 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Input Exam Details</h3>
              <p className="text-slate-400 text-sm">
                Enter your exam date, daily available study hours limit, subjects, and estimated topic durations.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Generate Timetable</h3>
              <p className="text-slate-400 text-sm">
                Our algorithm builds a non-overlapping daily timetable matched to your preferred study time slots.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Quiz & Adapt</h3>
              <p className="text-slate-400 text-sm">
                Test your knowledge with AI quizzes. If you fall behind, hit "I Fell Behind" to instantly re-balance.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 sm:p-12 border border-blue-500/30 text-center space-y-6 bg-gradient-to-b from-blue-950/40 to-slate-900/60 shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white">Ready to Transform Your Study Habits?</h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto">
              Join thousands of students building stress-free, adaptive study plans today.
            </p>
            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 text-base transition-all"
              >
                <span>Create Your Study Plan Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-300">Smart Study Planner</span>
          </div>
          <p>© {new Date().getFullYear()} Smart Study Planner. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
