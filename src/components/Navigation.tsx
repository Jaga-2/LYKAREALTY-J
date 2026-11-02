import React from 'react';
import { Screen, Currency, UserRole } from '../types';
import { Bookmark, Compass, Sparkles, User, Briefcase, Shield, Crown, LogIn } from 'lucide-react';
import { CurrencySwitcherWidget } from './CurrencySwitcherWidget';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  savedCount: number;
  onOpenShortlist: () => void;
  onOpenConsultation: () => void;
  onOpenComparison?: () => void;
  onOpenAIAssistant?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  savedCount,
  onOpenShortlist,
  onOpenConsultation,
  onOpenComparison,
  onOpenAIAssistant
}) => {
  const { t, language } = useLanguage();
  const { currentUser, currentRole, setIsAuthModalOpen, setAuthModalTab } = useAuth();

  const roleScreenMap: Record<UserRole, Screen> = {
    customer: 'customer-portal',
    sales_agent: 'agent-portal',
    admin: 'admin-portal',
    super_admin: 'superadmin-portal'
  };

  const currentRoleDashboardScreen = currentUser ? roleScreenMap[currentUser.role] : 'customer-portal';

  const roleBadgeLabel = {
    customer: language === 'ar' ? 'بوابة العميل' : 'Client Portal',
    sales_agent: language === 'ar' ? 'المستشار' : 'Agent Desk',
    admin: language === 'ar' ? 'العمليات' : 'Admin Desk',
    super_admin: language === 'ar' ? 'الإدارة التنفيذية' : 'Executive Desk'
  }[currentUser?.role || 'customer'];

  const roleIcon = {
    customer: <User className="w-3.5 h-3.5 text-[#c5a880]" />,
    sales_agent: <Briefcase className="w-3.5 h-3.5 text-[#ffd8eb]" />,
    admin: <Shield className="w-3.5 h-3.5 text-emerald-300" />,
    super_admin: <Crown className="w-3.5 h-3.5 text-[#ffe088]" />
  }[currentUser?.role || 'customer'];

  return (
    <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur-md border-b border-[#c5a880]/20 transition-all duration-200">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-12 h-20 flex items-center justify-between gap-2 sm:gap-4 overflow-hidden">
        
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-3 text-left focus:outline-none cursor-pointer shrink-0 min-w-0"
        >
          <img
            src="/assets/lyka-original-logo.png"
            alt="LYKA Realty logo"
            className="h-10 w-auto max-w-[120px] sm:max-w-[180px] object-contain select-none"
          />
          <div className="hidden lg:flex flex-col">
            <span className="font-editorial text-xl font-medium tracking-[0.18em] text-[#1f2428] whitespace-nowrap shrink-0 group-hover:text-[#5a1645] transition-colors">
              {t.nav.brand}
            </span>
            {language === 'ar' && (
              <span className="text-[10px] text-[#75777a] font-sans -mt-1 tracking-normal">
                {t.nav.brandTag}
              </span>
            )}
          </div>
        </button>

        {/* Zone 2: Navigation Links (Strict 3-Item Luxury Customer Navigation) */}
        <nav className="hidden md:flex items-center gap-8 text-[12.5px] tracking-[0.1em] font-medium uppercase text-[#44474a]">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-[#142B3B] relative py-1 whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'home' ? 'text-[#142B3B] font-semibold' : ''
            }`}
          >
            {t.nav.home}
            {currentScreen === 'home' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A46D]" />
            )}
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`transition-colors hover:text-[#142B3B] relative py-1 whitespace-nowrap shrink-0 cursor-pointer ${
              currentScreen === 'search' ? 'text-[#142B3B] font-semibold' : ''
            }`}
          >
            {t.nav.residences}
            {currentScreen === 'search' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A46D]" />
            )}
          </button>

          <button
            onClick={onOpenConsultation}
            className="hover:text-[#142B3B] transition-colors py-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {language === 'ar' ? 'تواصل / استفسار' : language === 'ta' ? 'தொடர்பு / ஆலோசனை' : 'Contact / Enquire'}
          </button>

          {/* Discreet Staff Workspace Indicator ONLY if Staff is Signed In */}
          {currentUser && currentUser.role !== 'customer' && (
            <button
              onClick={() => {
                if (currentUser.role === 'super_admin') onNavigate('superadmin-portal');
                else if (currentUser.role === 'admin') onNavigate('admin-portal');
                else onNavigate('agent-portal');
              }}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-[2px] bg-[#142B3B] text-[#C5A46D] border border-[#C5A46D]/40 hover:bg-[#0e1d27] transition-all cursor-pointer flex items-center gap-1.5"
            >
              {roleIcon}
              <span>{roleBadgeLabel}</span>
            </button>
          )}
        </nav>

        {/* Zone 3: AI Concierge + Account Profile + Currency + Shortlist + CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0 min-w-0">
          
          {/* AI Concierge Trigger */}
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              aria-label="LYKA AI Voice Assistant"
              title="LYKA AI Voice Assistant"
              className="p-2 text-[#C5A46D] bg-[#142B3B] hover:bg-[#0e1d27] border border-[#C5A46D]/60 rounded-[3px] transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#C5A46D]" />
              <span className="hidden xl:inline text-[11px] font-bold uppercase tracking-wider text-white">
                AI Voice Advisor
              </span>
            </button>
          )}

          {/* Account Profile / Client Access Pill */}
          <button
            onClick={() => {
              if (currentUser && currentUser.role !== 'customer') {
                if (currentUser.role === 'super_admin') onNavigate('superadmin-portal');
                else if (currentUser.role === 'admin') onNavigate('admin-portal');
                else onNavigate('agent-portal');
              } else {
                setAuthModalTab('login');
                setIsAuthModalOpen(true);
              }
            }}
            title={currentUser?.role !== 'customer' ? 'Staff Workspace' : 'Client Account Sign In'}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#142B3B] text-white hover:bg-[#0e1d27] border border-[#C5A46D]/40 rounded-[3px] transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-1.5">
              {roleIcon}
              <span className="hidden md:inline text-xs font-semibold tracking-wide text-white">
                {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
              </span>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-[2px] ${
              currentUser?.role === 'super_admin' ? 'bg-[#C5A46D] text-[#142B3B]' :
              currentUser?.role === 'admin' ? 'bg-[#477A65] text-white' :
              currentUser?.role === 'sales_agent' ? 'bg-[#C5A46D] text-[#142B3B]' :
              'bg-[#C5A46D] text-[#142B3B]'
            }`}>
              {currentUser?.role === 'super_admin' ? 'Super Admin' :
               currentUser?.role === 'admin' ? 'Admin' :
               currentUser?.role === 'sales_agent' ? 'Agent' :
               'Client'}
            </span>
          </button>

          {/* Dynamic Language Switcher (EN / العربية / தமிழ்) */}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {/* Real-Time Live Currency Converter Widget */}
          <div className="hidden xl:block">
            <CurrencySwitcherWidget />
          </div>

          {/* Shortlist Drawer Trigger */}
          <button
            onClick={onOpenShortlist}
            aria-label={t.nav.shortlist}
            title={t.nav.shortlist}
            className="relative p-2 text-[#142B3B] hover:text-[#C5A46D] transition-colors border border-[#C5A46D]/30 rounded-[3px] bg-white hover:border-[#C5A46D] cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#142B3B] text-[#C5A46D] text-[10px] font-bold flex items-center justify-center border border-[#C5A46D]">
                {savedCount}
              </span>
            )}
          </button>

          {/* Quick Compare Button when 2+ properties are saved */}
          {savedCount >= 2 && onOpenComparison && (
            <button
              onClick={onOpenComparison}
              aria-label={t.nav.compare}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase border border-[#C5A46D]/40 rounded-[3px] bg-white text-[#142B3B] hover:bg-[#F7F4EF] hover:border-[#C5A46D] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#C5A46D]" />
              <span>{t.nav.compare}</span>
            </button>
          )}

          {/* Primary Action Button */}
          {currentScreen === 'home' ? (
            <button
              onClick={() => onNavigate('search')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase bg-[#142B3B] text-[#C5A46D] rounded-[3px] border border-[#C5A46D]/40 hover:bg-[#0e1d27] hover:border-[#C5A46D] transition-all whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t.nav.searchPortfolio}</span>
            </button>
          ) : (
            <button
              onClick={onOpenConsultation}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-[0.14em] uppercase bg-[#142B3B] text-[#C5A46D] rounded-[3px] border border-[#C5A46D]/40 hover:bg-[#0e1d27] hover:border-[#C5A46D] transition-all whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.nav.privateBriefing}</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
