import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forgotPasswordApi, verifyResetCodeApi, resetPasswordApi } from '../services/authService';
import PasswordValidationChecklist, { isPasswordValid } from '../components/PasswordValidationChecklist';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock, ShieldCheck, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  // Step 1: Send Reset Code Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await forgotPasswordApi(email);
      if (res.success) {
        setSuccessMsg(res.message || 'Verification code sent successfully.');
        setStep(2);
      } else {
        setError(res.message || 'Failed to send verification code.');
      }
    } catch (err) {
      console.error('FORGOT PASSWORD ERROR:', err.response?.data || err.message);
      console.error('STATUS:', err.response?.status);
      setError(err.response?.data?.message || 'Error sending password reset request');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit OTP Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await verifyResetCodeApi(email, code.trim());
      if (res.success) {
        setSuccessMsg('Code verified! Please enter your new password.');
        setStep(3);
      } else {
        setError(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password & Auto-Login
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isPasswordValid(newPassword)) {
      setError('Password does not fulfill all security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordApi(email, code.trim(), newPassword);
      if (res.success) {
        setSuccessMsg('Password reset successfully! Redirecting...');
        if (res.user && res.token) {
          login(res.user, res.token);
          setTimeout(() => {
            if (!res.user.isOnboarded) {
              navigate('/onboarding');
            } else {
              navigate('/dashboard');
            }
          }, 1500);
        } else {
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-slate-800 space-y-6 shadow-2xl animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-slate-400 text-xs">
            {step === 1 && 'Enter your registered email address to receive a 6-digit verification code.'}
            {step === 2 && `Enter the 6-digit verification code sent to ${email}`}
            {step === 3 && 'Create a strong new password for your account.'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL ENTRY FORM */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION CODE FORM */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="482731"
                  required
                  className="w-full px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-bold"
                />
                <ShieldCheck className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                Verification code expires in 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Verifying Code...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-slate-400 hover:text-white transition-colors py-1 flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Resend Code to {email}</span>
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD FORM */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Live Password Validation Checklist */}
            <PasswordValidationChecklist password={newPassword} />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-rose-400 mt-1 font-medium">Passwords do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Reset Password & Log In'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center border-t border-slate-800/80">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
