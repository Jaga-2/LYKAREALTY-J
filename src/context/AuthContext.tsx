import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole, UserSession } from '../types';
import { apiUrl } from '../lib/api';

interface AuthContextType {
  currentUser: UserSession | null;
  currentRole: UserRole | 'guest';
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, role?: UserRole, password?: string) => Promise<void>;
  registerCustomer: (name: string, email: string, phone: string, password?: string) => Promise<void>;
  setCurrentUserDirectly: (user: UserSession | null) => void;
  setSessionTokenDirectly: (token: string | null) => void;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register' | 'switch-role';
  setAuthModalTab: (tab: 'login' | 'register' | 'switch-role') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const stored = sessionStorage.getItem('lyka_session_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('lyka_session_token');
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'switch-role'>('switch-role');

  const currentRole: UserRole | 'guest' = currentUser ? currentUser.role : 'guest';
  const isAuthenticated = currentUser !== null;

  const setCurrentUserDirectly = useCallback((user: UserSession | null) => {
    setCurrentUser(user);
    if (user) {
      sessionStorage.setItem('lyka_session_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('lyka_session_user');
    }
  }, []);

  const setSessionTokenDirectly = useCallback((tok: string | null) => {
    setToken(tok);
    if (tok) {
      sessionStorage.setItem('lyka_session_token', tok);
    } else {
      sessionStorage.removeItem('lyka_session_token');
    }
  }, []);

  const login = useCallback(async (email: string, role?: UserRole, password?: string) => {
    try {
      if (!email?.trim() || !password) {
        throw new Error('Email and password are required.');
      }
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: role || 'customer', password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
        sessionStorage.setItem('lyka_session_token', data.token);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(data.user));
      } else {
        const data = await res.json().catch(() => ({ error: 'Authentication failed.' }));
        throw new Error(data.error || 'Authentication failed.');
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Authentication failed.');
    }
    setIsAuthModalOpen(false);
  }, []);

  const registerCustomer = useCallback(async (name: string, email: string, phone: string, password?: string) => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
        sessionStorage.setItem('lyka_session_token', data.token);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(data.user));
      } else {
        const data = await res.json().catch(() => ({ error: 'Registration failed.' }));
        throw new Error(data.error || 'Registration failed.');
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Registration failed.');
    }
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentToken = sessionStorage.getItem('lyka_session_token');
      if (currentToken) {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`
          }
        });
      }
    } catch (e) {
      // ignore
    } finally {
      sessionStorage.removeItem('lyka_session_token');
      sessionStorage.removeItem('lyka_session_user');
      setToken(null);
      setCurrentUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        token,
        login,
        registerCustomer,
        setCurrentUserDirectly,
        setSessionTokenDirectly,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalTab,
        setAuthModalTab
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
