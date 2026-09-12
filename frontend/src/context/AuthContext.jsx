import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sq_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('sq_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      // Save state
      setToken(receivedToken);
      setUser(receivedUser);

      // Save to localStorage
      localStorage.setItem('sq_token', receivedToken);
      localStorage.setItem('sq_user', JSON.stringify(receivedUser));

      return { success: true, user: receivedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sq_token');
    localStorage.removeItem('sq_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading }}>
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

export default AuthContext;
