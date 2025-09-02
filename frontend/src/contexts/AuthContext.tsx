// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 1) On mount, restore token only (do NOT set a fake user)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // 2) Whenever we have a token, fetch the real user (includes role)
  useEffect(() => {
    let cancelled = false;
    const requestToken = token; // pin the token used for THIS request

    // keep axios auth header in sync (optional but recommended)
    if (requestToken) {
      (apiClient.defaults.headers as any).Authorization = `Bearer ${requestToken}`;
    } else {
      delete (apiClient.defaults.headers as any).Authorization;
    }

    const loadMe = async () => {
      if (!requestToken) {
        if (!cancelled) setUser(null);
        return;
      }
      try {
        const res = await apiClient.get('/users/me');
        // if token changed while the request was in-flight, ignore this result
        if (cancelled || token !== requestToken) return;
        setUser(res.data);
      } catch (err) {
        // ignore failures from a stale request
        if (cancelled || token !== requestToken) return;
        // only clear if the *current* token actually failed
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    };

    loadMe();
    return () => { cancelled = true; };
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Optional eager fetch (the effect above will also run)
    (async () => {
      try {
        const res = await apiClient.get('/users/me');
        setUser(res.data);
      } catch {
        // ignore; effect will handle clearing if needed
      }
    })();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Add a refreshUser function to fetch updated user data
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
