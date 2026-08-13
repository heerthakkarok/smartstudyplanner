import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const error = params.get('error');

      if (token) {
        try {
          const userObj = await loginWithToken(token);
          if (userObj) {
            if (!userObj.isOnboarded) {
              navigate('/onboarding', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (e) {
          console.error('Error handling Google token callback:', e);
          navigate('/login?error=google_auth_failed', { replace: true });
        }
      } else if (error) {
        navigate(`/login?error=${error}`, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    handleAuth();
  }, [location, navigate, loginWithToken]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-slate-950 text-slate-100 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-sm font-semibold text-slate-300">Authenticating with Google...</p>
      <p className="text-xs text-slate-500">Completing your secure sign-in</p>
    </div>
  );
};

export default AuthCallback;
