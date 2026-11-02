import React, { useState } from 'react';
import { Lock, Shield, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiUrl } from '../lib/api';
import { Screen } from '../types';

interface StaffLoginScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const StaffLoginScreen: React.FC<StaffLoginScreenProps> = ({ onNavigate }) => {
  const { setCurrentUserDirectly, setSessionTokenDirectly } = useAuth();
  const { language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStaffLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/auth/staff-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPass })
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || (res.status === 401
          ? 'Invalid staff credentials. Check your corporate email and password.'
          : 'Authentication rejected by security protocol.'));
      }

      setSessionTokenDirectly(data.token);
      setCurrentUserDirectly(data.user);

      // Route to appropriate staff desk
      if (data.user.role === 'super_admin') {
        onNavigate('superadmin-portal');
      } else if (data.user.role === 'admin' || data.user.role === 'manager') {
        onNavigate('admin-portal');
      } else {
        onNavigate('agent-portal');
      }
    } catch (err: any) {
      setError(err.message || 'Staff authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your corporate email and password.');
      return;
    }
    handleStaffLogin(email, password);
  };

  return (
    <div className="min-h-[85vh] bg-[#121517] text-white flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-xl bg-[#1f2428] border border-[#c5a880]/40 rounded-[4px] shadow-2xl p-6 sm:p-10 space-y-8">
        
        {/* Emblem & Editorial Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center shadow-md overflow-hidden rounded-[2px] bg-[#121517] border border-[#c5a880] w-20 h-16">
            <img src="/assets/lyka-original-logo.png" alt="LYKA Realty logo" className="h-full w-full object-contain bg-[#121517] p-1.5" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a880] font-bold block">
            LYKA Realty Dubai · Internal Staff Portal
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-tight text-white">
            Advisory & Operations Desk
          </h1>
          <p className="text-xs text-[#999] max-w-md mx-auto leading-relaxed">
            Restricted gateway for licensed LYKA advisors, brokerage operators, and executive partners. All access is cryptographically audited in PostgreSQL.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-[3px] flex items-center gap-2.5 text-xs text-rose-200 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Corporate Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#bbb] font-medium mb-1.5">
              Corporate Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="advisor@lykarealty.ae"
              required
              className="w-full px-3.5 py-2.5 bg-[#121517] border border-[#c5a880]/30 rounded-[2px] text-xs sm:text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#bbb] font-medium mb-1.5">
              Staff Password / Security Token
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-[#121517] border border-[#c5a880]/30 rounded-[2px] text-xs sm:text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#c5a880] hover:bg-[#d6b78d] text-[#121517] font-bold text-xs uppercase tracking-[0.14em] rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              {isLoading ? (
                <span>Validating Cryptographic Credentials...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Open Staff Desk</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Discreet Return Link */}
        <div className="text-center pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-[#888] hover:text-[#c5a880] transition-colors underline cursor-pointer"
          >
            ← Return to Public Portfolio & Client Residences
          </button>
        </div>

      </div>
    </div>
  );
};
