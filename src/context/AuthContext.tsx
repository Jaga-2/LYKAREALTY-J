import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, UserSession } from '../types';

export const PRESET_USERS: Record<UserRole, UserSession> = {
  customer: {
    id: 'cust-vance-01',
    name: 'Lady Alexandra Vance',
    email: 'alexandra.vance@vanceholdings.ch',
    phone: '+41 79 555 0192',
    role: 'customer',
    title: 'Sovereign Family Office Principal',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    assignedAgentId: 'agent-01'
  },
  sales_agent: {
    id: 'agent-01',
    name: 'Rashid Al-Falasi',
    email: 'rashid.alfalasi@lykarealty.ae',
    phone: '+971 50 842 9110',
    role: 'sales_agent',
    title: 'Senior Sovereign Advisor — Palm Jumeirah & Waterfront',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  admin: {
    id: 'admin-01',
    name: 'Elena Rostova',
    email: 'elena.rostova@lykarealty.ae',
    phone: '+971 4 812 9000',
    role: 'admin',
    title: 'Head of Private Client Operations & Lead Allocation',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  super_admin: {
    id: 'superadmin-01',
    name: 'Mansour Al-Nahyan',
    email: 'mansour.nahyan@lykarealty.ae',
    phone: '+971 4 800 0001',
    role: 'super_admin',
    title: 'Managing Director & Principal Executive Partner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
};

interface AuthContextType {
  currentUser: UserSession | null;
  currentRole: UserRole | 'guest';
  isAuthenticated: boolean;
  token: string | null;
  loginAs: (role: UserRole) => Promise<void>;
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
    return PRESET_USERS.customer;
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

  // Auto-acquire backend token for initial user if none exists
  useEffect(() => {
    const syncBackendSession = async () => {
      const currentStoredToken = sessionStorage.getItem('lyka_session_token');
      if (!currentStoredToken && currentUser) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, role: currentUser.role })
          });
          if (res.ok) {
            const data = await res.json();
            setToken(data.token);
            sessionStorage.setItem('lyka_session_token', data.token);
            sessionStorage.setItem('lyka_session_user', JSON.stringify(data.user));
            setCurrentUser(data.user);
          }
        } catch (e) {
          console.warn('[AuthContext] Backend session sync fallback:', e);
        }
      }
    };
    syncBackendSession();
  }, []);

  const loginAs = useCallback(async (role: UserRole) => {
    const preset = PRESET_USERS[role];
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preset.email, role })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
        sessionStorage.setItem('lyka_session_token', data.token);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(data.user));
      } else {
        // Fallback for offline dev
        setCurrentUser(preset);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(preset));
      }
    } catch (e) {
      setCurrentUser(preset);
      sessionStorage.setItem('lyka_session_user', JSON.stringify(preset));
    }
    setIsAuthModalOpen(false);
  }, []);

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
    const base = role ? PRESET_USERS[role] : PRESET_USERS.customer;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || base.email, role: role || 'customer', password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setCurrentUser(data.user);
        sessionStorage.setItem('lyka_session_token', data.token);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(data.user));
      } else {
        const u = { ...base, email: email || base.email };
        setCurrentUser(u);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(u));
      }
    } catch (e) {
      const u = { ...base, email: email || base.email };
      setCurrentUser(u);
      sessionStorage.setItem('lyka_session_user', JSON.stringify(u));
    }
    setIsAuthModalOpen(false);
  }, []);

  const registerCustomer = useCallback(async (name: string, email: string, phone: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
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
        const newCust: UserSession = {
          id: `cust-${Date.now()}`,
          name: name || 'Valued Sovereign Client',
          email,
          phone,
          role: 'customer',
          title: 'Private Investor Member',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          assignedAgentId: 'agent-01'
        };
        setCurrentUser(newCust);
        sessionStorage.setItem('lyka_session_user', JSON.stringify(newCust));
      }
    } catch (e) {
      const newCust: UserSession = {
        id: `cust-${Date.now()}`,
        name: name || 'Valued Sovereign Client',
        email,
        phone,
        role: 'customer',
        title: 'Private Investor Member',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        assignedAgentId: 'agent-01'
      };
      setCurrentUser(newCust);
      sessionStorage.setItem('lyka_session_user', JSON.stringify(newCust));
    }
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      const currentToken = sessionStorage.getItem('lyka_session_token');
      if (currentToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` }
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
        loginAs,
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
