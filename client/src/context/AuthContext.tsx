import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => void;
  setErrorMsg: (msg: string | null) => void;
  errorMsg: string | null;
  successMsg: string | null;
  setSuccessMsg: (msg: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('aether_task_token'));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('aether_task_token');
      if (storedToken) {
        try {
          const response = await api.auth.me();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Session restoration failed:', error);
          // Token is invalid/expired
          localStorage.removeItem('aether_task_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setErrorMsg(null);
    try {
      const response = await api.auth.login({ email, password });
      localStorage.setItem('aether_task_token', response.token);
      setToken(response.token);
      setUser(response.user);
      setSuccessMsg('Logged in successfully!');
    } catch (error: any) {
      setErrorMsg(error.message || 'Login failed.');
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    setErrorMsg(null);
    try {
      const response = await api.auth.signup({ email, password, name, role });
      localStorage.setItem('aether_task_token', response.token);
      setToken(response.token);
      setUser(response.user);
      setSuccessMsg('Registered successfully!');
    } catch (error: any) {
      setErrorMsg(error.message || 'Signup failed.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('aether_task_token');
    setToken(null);
    setUser(null);
    setSuccessMsg('Logged out successfully.');
  };

  // Auto clear alerts
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        errorMsg,
        setErrorMsg,
        successMsg,
        setSuccessMsg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
