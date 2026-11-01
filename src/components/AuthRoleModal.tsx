import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, AlertCircle, KeyRound, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AuthRoleModalProps {
  onNavigateToRoleDashboard: (screen: Screen) => void;
}

export const AuthRoleModal: React.FC<AuthRoleModalProps> = ({ onNavigateToRoleDashboard }) => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    registerCustomer,
    logout
  } = useAuth();
  const { t, language } = useLanguage();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setError('Please provide your client email address.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(loginEmail, 'customer', loginPassword || 'Lyka2025!');
      setIsAuthModalOpen(false);
      onNavigateToRoleDashboard('customer-portal');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regName) {
      setError('Name and email are required for client registration.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await registerCustomer(regName, regEmail, regPhone, regPassword || 'LykaClient2025!');
      setIsAuthModalOpen(false);
      onNavigateToRoleDashboard('customer-portal');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClientQuickFill = () => {
    setLoginEmail('customer.demo@lykarealty.ae');
    setLoginPassword('Lyka2025!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#faf9f7] rounded-[4px] border border-[#c5a880]/40 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1f2428] text-white px-6 py-4 flex items-center justify-between border-b border-[#c5a880]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[2px] bg-[#121517] border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="label-caps text-[#c5a880] text-[10px]">LYKA Sovereign Client Gateway</span>
              <h3 className="font-editorial text-lg text-white font-medium leading-none mt-0.5">
                {currentUser && currentUser.role === 'customer'
                  ? 'Client Profile Management'
                  : authModalTab === 'register'
                  ? 'Create Client Account'
                  : 'Client Authentication'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-[#dadad8] hover:text-white rounded-[2px] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If user is already logged in as a client */}
        {currentUser && currentUser.role === 'customer' ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-white rounded-[3px] border border-[#c5a880]/30 shadow-xs">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border border-[#c5a880]/50"
              />
              <div className="flex-1 min-w-0">
                <div className="font-editorial text-base font-medium text-[#1f2428] truncate">
                  {currentUser.name}
                </div>
                <div className="text-xs text-[#75777a] truncate">{currentUser.email}</div>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-[2px] bg-[#c5a880]/20 text-[#6a4f21]">
                  Verified Client Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  onNavigateToRoleDashboard('customer-portal');
                }}
                className="w-full py-2.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center"
              >
                Go to Client Portal
              </button>
              <button
                onClick={async () => {
                  await logout();
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-2.5 bg-[#faf9f7] hover:bg-[#eee] text-[#ba1a1a] border border-[#ba1a1a]/30 text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab switcher: Client Sign In vs Register */}
            <div className="flex border-b border-[#c5a880]/20 bg-[#f4f2ee] text-xs font-medium tracking-wider uppercase">
              <button
                onClick={() => {
                  setError(null);
                  setAuthModalTab('login');
                }}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-all cursor-pointer ${
                  authModalTab !== 'register'
                    ? 'border-[#5a1645] text-[#1f2428] font-bold bg-[#faf9f7]'
                    : 'border-transparent text-[#75777a] hover:text-[#1f2428]'
                }`}
              >
                Client Sign In
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setAuthModalTab('register');
                }}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-all cursor-pointer ${
                  authModalTab === 'register'
                    ? 'border-[#5a1645] text-[#1f2428] font-bold bg-[#faf9f7]'
                    : 'border-transparent text-[#75777a] hover:text-[#1f2428]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-[3px] flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB: Sign In */}
              {authModalTab !== 'register' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="client@sovereign-holdings.com"
                      required
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={handleDemoClientQuickFill}
                      className="text-[11px] text-[#5a1645] hover:underline font-semibold cursor-pointer"
                    >
                      Fill Demo Client (customer.demo@lykarealty.ae)
                    </button>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                    >
                      {isLoading ? (
                        <span>Authenticating Client...</span>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Access Client Portfolio</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: Register */}
              {authModalTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Lady Alexandra Vance"
                      required
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Primary Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="alexandra.vance@vanceholdings.ch"
                      required
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Phone / Mobile
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#75777a] font-medium mb-1">
                      Set Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 bg-white rounded-[2px] border border-[#c5a880]/30 text-xs text-[#1f2428] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-[#5a1645] hover:bg-[#471237] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
                    >
                      {isLoading ? (
                        <span>Registering Client Account...</span>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>Complete Client Registration</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Discrete Staff & Advisory Portal Entry */}
        <div className="bg-[#1f2428] px-6 py-3 border-t border-[#c5a880]/20 flex items-center justify-between text-xs">
          <span className="text-[#888] text-[11px]">
            LYKA Realty Staff / Advisory Personnel?
          </span>
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              onNavigateToRoleDashboard('staff-login');
            }}
            className="text-[#c5a880] hover:text-white font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Staff Terminal</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
