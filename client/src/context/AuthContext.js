// client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData.user);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      console.log('🟢 AuthContext: Calling authService.login');
      const data = await authService.login(credentials);
      console.log('✅ Login response:', data);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('🔴 AuthContext: Login error:', err);
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      console.log('🟢 AuthContext: Calling authService.register');
      const data = await authService.register(userData);
      console.log('✅ Register response:', data);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('🔴 AuthContext: Signup error:', err);
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // ✅ UPDATED: Accept onNavigate callback
  const logout = (onNavigate) => {
    authService.logout();
    setUser(null);
    
    // ✅ NEW: Redirect to landing page
    if (onNavigate) {
      onNavigate('landing');
    }
    
    console.log('🚪 User logged out, redirecting to landing page');
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};