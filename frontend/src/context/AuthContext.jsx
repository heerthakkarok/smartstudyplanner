import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getCurrentUser, logoutUser } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const data = await getCurrentUser();
          if (data.success) {
            setUser(data.user);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Failed to fetch auth user:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const handleLogin = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const handleRegister = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const loginWithToken = async (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const data = await getCurrentUser();
      if (data.success) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.error('Failed to fetch user with token:', err);
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore errors on logout
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser((prev) => ({ ...prev, ...updatedUserData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        register: handleRegister,
        loginWithToken,
        logout: handleLogout,
        updateUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
