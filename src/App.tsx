import React, { useState, useEffect } from 'react';
import { Screen, Currency, AreaUnit, Property, FilterState } from './types';
import { PROPERTIES } from './data/properties';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { CuratedCollection } from './components/CuratedCollection';
import { SovereignAtelier } from './components/SovereignAtelier';
import { MarketPulse } from './components/MarketPulse';
import { MarketMonograph } from './components/MarketMonograph';
import { ClientAttributions } from './components/ClientAttributions';
import { PropertySearchScreen } from './components/PropertySearchScreen';
import { MonographModal } from './components/MonographModal';
import { ShortlistDrawer } from './components/ShortlistDrawer';
import { PropertyComparisonModal } from './components/PropertyComparisonModal';
import { PrivateConsultationModal } from './components/PrivateConsultationModal';
import { Footer } from './components/Footer';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard';
import { SalesAgentDashboard } from './components/dashboards/SalesAgentDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AuthRoleModal } from './components/AuthRoleModal';
import { StaffLoginScreen } from './components/StaffLoginScreen';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sparkles, ShieldAlert } from 'lucide-react';

const SCREEN_TO_HASH: Record<Screen, string> = {
  home: '#/',
  search: '#/residences',
  'customer-portal': '#/customer',
  'agent-portal': '#/staff/agent',
  'admin-portal': '#/staff/admin',
  'superadmin-portal': '#/staff/super-admin',
  'staff-login': '#/staff/login'
};

const HASH_TO_SCREEN: Record<string, Screen> = {
  '#/': 'home',
  '': 'home',
  '#': 'home',
  '#/residences': 'search',
  '#/customer': 'customer-portal',
  '#/staff': 'staff-login',
  '#/staff/login': 'staff-login',
  '#/staff/agent': 'agent-portal',
  '#/staff/admin': 'admin-portal',
  '#/staff/super-admin': 'superadmin-portal',
  // Backward compatibility:
  '#/agent': 'agent-portal',
  '#/admin': 'admin-portal',
  '#/super-admin': 'superadmin-portal'
};

interface AccessGuardProps {
  roleTitle: string;
  onNavigateHome: () => void;
  onOpenStaffGate: () => void;
}

const AccessGuard: React.FC<AccessGuardProps> = ({ roleTitle, onNavigateHome, onOpenStaffGate }) => (
  <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-[4px] border border-[#c5a880]/40 shadow-xl text-center space-y-5 animate-fadeIn">
    <div className="w-16 h-16 rounded-full bg-[#1f2428] border-2 border-[#c5a880] text-[#c5a880] flex items-center justify-center mx-auto shadow-md">
      <ShieldAlert className="w-8 h-8 text-[#ffd8eb]" />
    </div>
    <div className="space-y-2">
      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#5a1645] font-bold block">
        Diplomatic Security Protocol · Regulatory Isolation
      </span>
      <h2 className="font-editorial text-2xl text-[#1f2428] font-medium">
        Employee Authorization Required
      </h2>
      <p className="text-xs text-[#666] max-w-md mx-auto leading-relaxed">
        Access to this workspace is reserved exclusively for registered LYKA Realty <strong className="text-[#1f2428]">{roleTitle}</strong> personnel. Customer sessions and unauthorized inquiries are strictly quarantined.
      </p>
    </div>

    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={onNavigateHome}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#faf9f7] hover:bg-[#f0ece5] text-[#1f2428] border border-[#c5a880]/50 rounded-[2px] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
      >
        Return to Client Portal
      </button>
      <button
        onClick={onOpenStaffGate}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#1f2428] hover:bg-[#121517] text-[#c5a880] border border-[#c5a880] rounded-[2px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
      >
        Staff & Advisor Sign-In
      </button>
    </div>
  </div>
);

function AppContent() {
  const { currentUser, setIsAuthModalOpen, setAuthModalTab } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const { currency, setCurrency } = useCurrency();
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('sqft');
  
  // Hash synchronization on mount and hashchange
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash || '#/';
      if (HASH_TO_SCREEN[hash]) {
        setCurrentScreen(HASH_TO_SCREEN[hash]);
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  // Persistent saved shortlist
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lyka_shortlist');
      return stored ? JSON.parse(stored) : ['res-palm-01', 'res-jumeirah-bay-03'];
    } catch {
      return ['res-palm-01', 'res-jumeirah-bay-03'];
    }
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>(PROPERTIES);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonPropertyIds, setComparisonPropertyIds] = useState<string[]>([]);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [consultationPropertyTitle, setConsultationPropertyTitle] = useState<string | undefined>();
  const [initialSearchFilters, setInitialSearchFilters] = useState<Partial<FilterState>>({});

  // Load real properties from connected database for curated display
  useEffect(() => {
    let isMounted = true;
    fetch('/api/properties?limit=6&sortBy=price-desc')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.properties && data.properties.length > 0) {
          setFeaturedProperties(data.properties);
        }
      })
      .catch((err) => console.warn('[App] Live featured load fallback:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lyka_shortlist', JSON.stringify(savedIds));
    } catch (e) {
      // ignore
    }
  }, [savedIds]);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    const hash = SCREEN_TO_HASH[screen] || '#/';
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenConsultation = (propertyTitle?: string) => {
    setConsultationPropertyTitle(propertyTitle);
    setIsConsultationOpen(true);
  };

  const handleHeroQuickSearch = (filters: Partial<FilterState>) => {
    setInitialSearchFilters(filters);
    handleNavigate('search');
  };

  const savedProperties = PROPERTIES.filter((p) => savedIds.includes(p.id));

  const handleOpenComparison = (selectedIds?: string[]) => {
    if (selectedIds && selectedIds.length > 0) {
      setComparisonPropertyIds(selectedIds.slice(0, 3));
    } else if (comparisonPropertyIds.length === 0) {
      setComparisonPropertyIds(savedIds.slice(0, 3));
    }
    setIsComparisonOpen(true);
  };

  const handleToggleComparisonProperty = (property: Property) => {
    setComparisonPropertyIds((prev) => {
      if (prev.includes(property.id)) {
        return prev.filter((id) => id !== property.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), property.id];
      }
      return [...prev, property.id];
    });
  };

  const comparedProperties = PROPERTIES.filter((p) =>
    comparisonPropertyIds.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1c1b] flex flex-col font-sans selection:bg-[#c5a880]/30 selection:text-[#1f2428]">
      
      {/* Top Bar Navigation */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        currency={currency}
        onCurrencyChange={setCurrency}
        savedCount={savedIds.length}
        onOpenShortlist={() => setIsShortlistOpen(true)}
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenComparison={() => handleOpenComparison()}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      {/* Main Screen Body */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          /* Screen 1: Public Homepage - LYKA Realty */
          <div className="animate-fadeIn">
            <HeroSection
              onSearchWithFilters={handleHeroQuickSearch}
              onNavigate={handleNavigate}
            />

            <CuratedCollection
              properties={featuredProperties}
              currency={currency}
              areaUnit={areaUnit}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onSelectProperty={(prop) => setSelectedProperty(prop)}
              onNavigate={handleNavigate}
            />

            <MarketPulse
              currency={currency}
              onOpenConsultation={() => handleOpenConsultation()}
            />

            <SovereignAtelier
              onOpenConsultation={() => handleOpenConsultation()}
            />

            <MarketMonograph />

            <ClientAttributions />
          </div>
        )}

        {currentScreen === 'search' && (
          /* Screen 2: Property Search Screen */
          <div className="animate-fadeIn">
            <PropertySearchScreen
              properties={featuredProperties}
              currency={currency}
              onCurrencyChange={setCurrency}
              areaUnit={areaUnit}
              onAreaUnitChange={setAreaUnit}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onSelectProperty={(prop) => setSelectedProperty(prop)}
              onNavigate={handleNavigate}
              onOpenConsultation={(title) => handleOpenConsultation(title)}
              initialFilters={initialSearchFilters}
            />
          </div>
        )}

        {currentScreen === 'customer-portal' && (
          /* Screen 3: Customer Experience Portal */
          <div className="animate-fadeIn">
            <CustomerDashboard
              onNavigate={handleNavigate}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
              onSelectProperty={(prop) => setSelectedProperty(prop)}
              onOpenComparison={(selectedIds) => handleOpenComparison(selectedIds)}
              onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
            />
          </div>
        )}

        {currentScreen === 'agent-portal' && (
          /* Screen 4: Sales Agent Workspace (Role Protected) */
          <div className="animate-fadeIn">
            {!currentUser || currentUser.role === 'customer' ? (
              <AccessGuard
                roleTitle="Sales Agent"
                onNavigateHome={() => handleNavigate('customer-portal')}
                onOpenStaffGate={() => handleNavigate('staff-login')}
              />
            ) : (
              <SalesAgentDashboard />
            )}
          </div>
        )}

        {currentScreen === 'admin-portal' && (
          /* Screen 5: Admin Operations (Role Protected) */
          <div className="animate-fadeIn">
            {!currentUser || currentUser.role === 'customer' || currentUser.role === 'sales_agent' ? (
              <AccessGuard
                roleTitle="Admin Operations"
                onNavigateHome={() => handleNavigate('customer-portal')}
                onOpenStaffGate={() => handleNavigate('staff-login')}
              />
            ) : (
              <AdminDashboard />
            )}
          </div>
        )}

        {currentScreen === 'superadmin-portal' && (
          /* Screen 6: Super Admin Executive Governance (Role Protected) */
          <div className="animate-fadeIn">
            {!currentUser || currentUser.role !== 'super_admin' ? (
              <AccessGuard
                roleTitle="Super Admin Executive"
                onNavigateHome={() => handleNavigate('customer-portal')}
                onOpenStaffGate={() => handleNavigate('staff-login')}
              />
            ) : (
              <SuperAdminDashboard />
            )}
          </div>
        )}

        {currentScreen === 'staff-login' && (
          /* Discreet Staff Terminal Login Route */
          <div className="animate-fadeIn">
            <StaffLoginScreen onNavigate={handleNavigate} />
          </div>
        )}
      </main>

      {/* Floating Sovereign AI Concierge Trigger */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        title="LYKA Sovereign AI Concierge"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-[#1f2428] text-[#c5a880] border border-[#c5a880]/60 shadow-2xl hover:bg-[#121517] hover:scale-105 transition-all cursor-pointer flex items-center gap-2 group"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Sparkles className="w-5 h-5 text-[#ffd8eb]" />
        <span className="hidden group-hover:inline-block text-xs font-semibold tracking-wider uppercase text-white pr-1 transition-all">
          AI Concierge
        </span>
      </button>

      {/* Quiet Editorial Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenConsultation={() => handleOpenConsultation()}
      />

      {/* Detailed Architectural Monograph Modal */}
      {selectedProperty && (
        <MonographModal
          property={selectedProperty}
          currency={currency}
          areaUnit={areaUnit}
          isSaved={savedIds.includes(selectedProperty.id)}
          onToggleSave={() => handleToggleSave(selectedProperty.id)}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Saved / Shortlist Side-by-Side Drawer */}
      <ShortlistDrawer
        isOpen={isShortlistOpen}
        onClose={() => setIsShortlistOpen(false)}
        savedProperties={savedProperties}
        currency={currency}
        areaUnit={areaUnit}
        onRemove={handleToggleSave}
        onSelectProperty={(prop) => setSelectedProperty(prop)}
        onOpenConsultation={() => {
          setIsShortlistOpen(false);
          handleOpenConsultation();
        }}
        onOpenComparison={(selectedIds) => handleOpenComparison(selectedIds)}
      />

      {/* Property Comparison Side-by-Side Modal */}
      <PropertyComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        selectedProperties={comparedProperties}
        allShortlistProperties={savedProperties}
        onToggleSelectProperty={handleToggleComparisonProperty}
        currency={currency}
        onCurrencyChange={setCurrency}
        areaUnit={areaUnit}
        onAreaUnitChange={setAreaUnit}
        onSelectProperty={(prop) => setSelectedProperty(prop)}
        onOpenConsultation={(title) => handleOpenConsultation(title)}
      />

      {/* Private Sovereign Consultation / Advisory Modal */}
      <PrivateConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        prefilledPropertyTitle={consultationPropertyTitle}
      />

      {/* AI Assistant Concierge Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onSelectProperty={(prop) => setSelectedProperty(prop)}
        onOpenConsultation={(title) => handleOpenConsultation(title)}
      />


      {/* Role-Based Authentication & Instant Role Switcher Modal */}
      <AuthRoleModal
        onNavigateToRoleDashboard={(screen) => handleNavigate(screen)}
      />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

