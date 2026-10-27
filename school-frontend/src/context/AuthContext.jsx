import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('school_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.id = parsed.id || parsed.userId;
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const userData = {
        ...response.data,
        id: response.data.id || response.data.userId,
      };
      setUser(userData);
      localStorage.setItem('school_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('school_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user }}>
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
