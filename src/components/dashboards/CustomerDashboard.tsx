import React, { useState, useEffect } from 'react';
import {
  User,
  Bookmark,
  Calendar,
  Calculator,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText,
  Sliders,
  DollarSign,
  TrendingUp,
  MapPin,
  Building,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Property, Currency, Screen } from '../../types';
import { PROPERTIES } from '../../data/properties';
import { customerApi, CustomerProfile } from '../../services/api/customerApi';
import { CustomerEnquiry, ViewingAppointment } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';

interface CustomerDashboardProps {
  onNavigate: (screen: Screen) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenComparison: (selectedIds?: string[]) => void;
  onOpenAIAssistant: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNavigate,
  savedIds,
  onToggleSave,
  onSelectProperty,
  onOpenComparison,
  onOpenAIAssistant
}) => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const { currency } = useCurrency();

  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'enquiries' | 'viewings' | 'emi' | 'profile'>('overview');

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);

  // EMI Calculator State
  const [loanPrincipalAED, setLoanPrincipalAED] = useState<number>(70000000); // 70M AED
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30); // 30%
  const [interestRatePercent, setInterestRatePercent] = useState<number>(4.75); // 4.75%
  const [tenureYears, setTenureYears] = useState<number>(20); // 20 years

  // New Viewing Request Form State
  const [selectedPropertyIdForViewing, setSelectedPropertyIdForViewing] = useState<string>(PROPERTIES[0].id);
  const [viewingDate, setViewingDate] = useState<string>('2026-11-05');
  const [viewingTime, setViewingTime] = useState<string>('16:00 GST');
  const [viewingNotes, setViewingNotes] = useState<string>('Chauffeur transfer requested from Bvlgari Marina.');
  const [viewingSuccess, setViewingSuccess] = useState(false);

  useEffect(() => {
    customerApi.getProfile().then(setProfile);
    customerApi.getEnquiries().then(setEnquiries);
    customerApi.getViewings().then(setViewings);
  }, []);

  const savedPropertyList = PROPERTIES.filter((p) => savedIds.includes(p.id));

  // EMI Math
  const downPaymentAED = (loanPrincipalAED * downPaymentPercent) / 100;
  const netLoanAmountAED = loanPrincipalAED - downPaymentAED;
  const monthlyRate = interestRatePercent / 100 / 12;
  const totalMonths = tenureYears * 12;
  const monthlyInstallmentAED =
    monthlyRate > 0
      ? (netLoanAmountAED * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : netLoanAmountAED / totalMonths;

  const handleBookViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    const prop = PROPERTIES.find((p) => p.id === selectedPropertyIdForViewing);
    if (!prop) return;

    const newViewing = await customerApi.requestViewing({
      propertyId: prop.id,
      propertyTitle: prop.title,
      date: viewingDate,
      time: viewingTime,
      notes: viewingNotes
    });

    setViewings((prev) => [newViewing, ...prev]);
    setViewingSuccess(true);
    setTimeout(() => setViewingSuccess(false), 4000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 animate-fadeIn">
      
      {/* Top Banner / Welcome Strip */}
      <div className="bg-[#1f2428] rounded-[4px] border border-[#c5a880]/30 p-6 sm:p-8 text-white mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5a1645]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="label-caps text-[#c5a880] text-[10px]">Client Sovereign Portal</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#5a1645] text-white text-[10px] font-bold tracking-wider uppercase">
                {profile?.investorTier || 'Sovereign Client'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-[2px]">
                <ShieldCheck className="w-3 h-3" /> KYC {profile?.kycStatus || 'Verified'}
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-wide">
              {language === 'ar'
                ? `أهلاً وسهلاً، ${currentUser?.name || 'سعادة العميل'}`
                : `Welcome, ${currentUser?.name || 'Valued Client'}`}
            </h1>

            <p className="text-xs sm:text-sm text-[#dadad8] font-light max-w-2xl leading-relaxed">
              Your confidential concierge for prime Dubai real estate, private viewings, escrow status, and direct advisory with Senior Partner Rashid Al-Falasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenAIAssistant}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5a1645] hover:bg-[#471237] text-white rounded-[2px] border border-[#d4af37]/40 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ffd8eb]" />
              <span>Launch AI Concierge</span>
            </button>

            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#c5a880] rounded-[2px] border border-[#c5a880]/30 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Explore Residences</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#c5a880]/20 text-xs">
          <div>
            <span className="text-[#8e9092] block text-[10px] uppercase tracking-wider">Saved Residences</span>
            <span className="text-lg font-editorial font-semibold text-[#ffd8eb]">{savedIds.length} Properties</span>
          </div>
          <div>
            <span className="text-[#8e9092] block text-[10px] uppercase tracking-wider">Active Inquiries</span>
            <span className="text-lg font-editorial font-semibold text-white">{enquiries.length} In Progress</span>
          </div>
          <div>
            <span className="text-[#8e9092] block text-[10px] uppercase tracking-wider">Scheduled Viewings</span>
            <span className="text-lg font-editorial font-semibold text-[#c5a880]">{viewings.length} Upcoming</span>
          </div>
          <div>
            <span className="text-[#8e9092] block text-[10px] uppercase tracking-wider">Dedicated Advisor</span>
            <span className="text-sm font-medium text-white truncate block">Rashid Al-Falasi</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#c5a880]/30 mb-8 overflow-x-auto bg-white rounded-t-[4px] px-2 shadow-sm">
        {[
          { key: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Executive Overview', icon: <Building className="w-4 h-4" /> },
          { key: 'saved', label: language === 'ar' ? 'المقتنيات المحفوظة' : `Saved Residences (${savedIds.length})`, icon: <Bookmark className="w-4 h-4" /> },
          { key: 'enquiries', label: language === 'ar' ? 'سجل الاستفسارات' : `Inquiry History (${enquiries.length})`, icon: <MessageSquare className="w-4 h-4" /> },
          { key: 'viewings', label: language === 'ar' ? 'المعاينات الخاصة' : `Private Viewings (${viewings.length})`, icon: <Calendar className="w-4 h-4" /> },
          { key: 'emi', label: language === 'ar' ? 'حاسبة التمويل' : 'Mortgage & EMI Calculator', icon: <Calculator className="w-4 h-4" /> },
          { key: 'profile', label: language === 'ar' ? 'الملف السيادي' : 'Client Profile & KYC', icon: <User className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 py-4 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#5a1645] text-[#5a1645] bg-[#faf6f8]'
                : 'border-transparent text-[#666] hover:text-[#1f2428] hover:bg-[#faf9f7]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Actions & Assigned Advisor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Dedicated Senior Advisor Card */}
            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="label-caps text-[#5a1645] text-[10px]">Your Dedicated Senior Advisor</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    alt="Rashid Al-Falasi"
                    className="w-14 h-14 rounded-[2px] object-cover border border-[#c5a880]/40"
                  />
                  <div>
                    <h3 className="font-editorial text-lg font-medium text-[#1f2428]">Rashid Al-Falasi</h3>
                    <p className="text-xs text-[#75777a]">Senior Sovereign Advisor</p>
                    <p className="text-[11px] text-[#5a1645] font-medium mt-0.5">Palm Jumeirah & Waterfront Desk</p>
                  </div>
                </div>
                <p className="text-xs text-[#555] leading-relaxed mb-4">
                  "Available 24/7 for off-market briefs, private helicopter inspections, and DIFC escrow settlements."
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#eee]">
                <a
                  href="https://wa.me/971508429110"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 text-center text-xs font-semibold bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 rounded-[2px] hover:bg-[#25D366]/20 transition-colors"
                >
                  WhatsApp Direct
                </a>
                <button
                  onClick={() => setActiveTab('viewings')}
                  className="flex-1 py-2 text-center text-xs font-semibold bg-[#1f2428] text-[#c5a880] rounded-[2px] hover:bg-[#121517] transition-colors"
                >
                  Book Private Tour
                </button>
              </div>
            </div>

            {/* Recent Enquiries Tracker */}
            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="label-caps text-[#c5a880] text-[10px]">Active Acquisition Mandate</span>
                  <button
                    onClick={() => setActiveTab('enquiries')}
                    className="text-xs text-[#5a1645] hover:underline"
                  >
                    View All ({enquiries.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {enquiries.slice(0, 2).map((enq) => (
                    <div key={enq.id} className="p-3 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/20 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#1f2428] mb-1">
                        <span className="truncate max-w-[180px]">{enq.propertyTitle}</span>
                        <span className="px-2 py-0.5 rounded-[2px] bg-[#5a1645] text-white text-[10px] tracking-wider uppercase">
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#666] line-clamp-1">{enq.message}</p>
                      <div className="mt-2 text-[10px] text-[#888] flex items-center justify-between">
                        <span>Submitted {enq.date}</span>
                        <span>{enq.budgetTier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('enquiries')}
                className="mt-4 w-full py-2 bg-[#f4f2ee] hover:bg-[#eae6df] text-xs font-semibold text-[#1f2428] rounded-[2px] transition-colors"
              >
                Track Complete Progress
              </button>
            </div>

            {/* Quick Mortgage Preview */}
            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="label-caps text-[#9a7833] text-[10px]">Private Wealth Financing Preview</span>
                  <button
                    onClick={() => setActiveTab('emi')}
                    className="text-xs text-[#5a1645] hover:underline"
                  >
                    Custom Simulator
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between pb-2 border-b border-[#eee]">
                    <span className="text-[#666]">Sample Property Value:</span>
                    <span className="font-semibold">{formatCurrency(loanPrincipalAED, currency)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#eee]">
                    <span className="text-[#666]">Down Payment ({downPaymentPercent}%):</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(downPaymentAED, currency)}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-[#eee]">
                    <span className="text-[#666]">Indicative Interest Rate:</span>
                    <span className="font-semibold">{interestRatePercent}% Fixed</span>
                  </div>
                  <div className="p-3 bg-[#5a1645]/5 rounded-[2px] border border-[#5a1645]/20">
                    <span className="text-[10px] uppercase tracking-wider text-[#5a1645] block font-bold">Estimated Monthly EMI</span>
                    <span className="text-xl font-editorial font-bold text-[#5a1645]">
                      {formatCurrency(monthlyInstallmentAED, currency)}
                      <span className="text-xs font-normal text-[#666] font-sans"> / month</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('emi')}
                className="mt-4 w-full py-2 bg-[#1f2428] text-[#c5a880] text-xs font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#121517] transition-colors"
              >
                Adjust Loan & Tenure
              </button>
            </div>

          </div>

          {/* Saved properties carousel / grid summary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-editorial text-xl font-medium text-[#1f2428]">
                  Curated Saved Portfolio ({savedIds.length})
                </h3>
                <p className="text-xs text-[#75777a]">
                  Residences marked for confidential dossier review or side-by-side comparison
                </p>
              </div>

              {savedIds.length >= 2 && (
                <button
                  onClick={() => onOpenComparison(savedIds)}
                  className="px-4 py-2 bg-[#5a1645] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#471237] transition-colors"
                >
                  Compare Saved ({savedIds.length})
                </button>
              )}
            </div>

            {savedPropertyList.length === 0 ? (
              <div className="bg-white p-8 rounded-[3px] border border-[#c5a880]/30 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-[#c5a880] mx-auto opacity-60" />
                <p className="text-sm text-[#444]">No residences in your shortlist yet.</p>
                <button
                  onClick={() => onNavigate('search')}
                  className="px-5 py-2 bg-[#1f2428] text-[#c5a880] text-xs uppercase tracking-wider font-semibold rounded-[2px]"
                >
                  Browse Prime Portfolio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPropertyList.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-black">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-[2px] bg-[#1f2428]/85 text-[#c5a880] text-[10px] font-bold uppercase tracking-wider">
                          {prop.location}
                        </div>
                        <button
                          onClick={() => onToggleSave(prop.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-[#5a1645] hover:bg-white transition-colors"
                          title="Remove from shortlist"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-editorial text-base font-medium text-[#1f2428] group-hover:text-[#5a1645] transition-colors">
                          {prop.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-[#666]">
                          <span>{prop.bedrooms} Bed · {prop.type}</span>
                          <span className="font-semibold text-[#1f2428]">
                            {formatCurrency(prop.priceAED, currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2">
                      <button
                        onClick={() => onSelectProperty(prop)}
                        className="flex-1 py-2 text-center text-xs font-semibold bg-[#1f2428] text-[#c5a880] rounded-[2px] hover:bg-[#121517] transition-colors"
                      >
                        View Dossier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPropertyIdForViewing(prop.id);
                          setActiveTab('viewings');
                        }}
                        className="px-3 py-2 text-xs font-semibold border border-[#c5a880]/40 rounded-[2px] hover:bg-[#faf9f7] text-[#1f2428] transition-colors"
                      >
                        Book Tour
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SAVED RESIDENCES */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Your Sovereign Shortlist
              </h2>
              <p className="text-xs text-[#75777a]">
                High-net-worth acquisitions flagged for legal due diligence and viewing schedules
              </p>
            </div>

            {savedIds.length >= 2 && (
              <button
                onClick={() => onOpenComparison(savedIds)}
                className="px-5 py-2.5 bg-[#5a1645] text-white text-xs font-semibold uppercase tracking-wider rounded-[2px] hover:bg-[#471237] transition-colors flex items-center gap-2"
              >
                <span>Launch Side-by-Side Comparison</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPropertyList.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-black">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-[2px] bg-[#1f2428]/85 text-[#c5a880] text-[10px] font-bold uppercase tracking-wider">
                      {prop.location}
                    </div>
                    <button
                      onClick={() => onToggleSave(prop.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white text-[#5a1645]"
                      title="Remove from saved"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <h4 className="font-editorial text-lg font-medium text-[#1f2428]">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-[#666] line-clamp-2">{prop.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#eee]">
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Valuation</span>
                        <span className="font-semibold text-[#1f2428]">{formatCurrency(prop.priceAED, currency)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Est. Yield</span>
                        <span className="font-semibold text-emerald-700">{prop.projectedYield}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Handover</span>
                        <span className="text-[#333]">{prop.handover}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Area</span>
                        <span className="text-[#333]">{prop.areaSqFt.toLocaleString()} sq.ft</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => onSelectProperty(prop)}
                    className="flex-1 py-2 text-center text-xs font-semibold bg-[#1f2428] text-[#c5a880] rounded-[2px] hover:bg-[#121517] transition-colors"
                  >
                    Full Dossier
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPropertyIdForViewing(prop.id);
                      setActiveTab('viewings');
                    }}
                    className="flex-1 py-2 text-center text-xs font-semibold border border-[#5a1645] text-[#5a1645] rounded-[2px] hover:bg-[#5a1645]/5 transition-colors"
                  >
                    Schedule Tour
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Acquisition Inquiries & Due Diligence Mandates
            </h2>
            <p className="text-xs text-[#75777a]">
              Complete chronological tracking of submitted property inquiries, assigned partners, and legal milestones
            </p>
          </div>

          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Residence Mandate</th>
                    <th className="py-3 px-4">Scope & Tier</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Callback Window</th>
                    <th className="py-3 px-4">Milestone Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#5a1645]">{enq.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#1f2428] block">{enq.propertyTitle}</span>
                        <span className="text-[11px] text-[#777] line-clamp-1">{enq.message}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block text-[#1f2428] font-medium">{enq.budgetTier}</span>
                        <span className="text-[10px] text-[#888]">{enq.advisoryScope}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#555]">{enq.date}</td>
                      <td className="py-3.5 px-4 text-[#555]">{enq.preferredCallbackTime}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-[2px] bg-[#5a1645] text-white text-[10px] font-bold uppercase tracking-wider inline-block">
                          {enq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={onOpenAIAssistant}
                          className="text-[11px] text-[#5a1645] hover:underline font-semibold"
                        >
                          Chat with AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRIVATE VIEWINGS */}
      {activeTab === 'viewings' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Viewings List */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                  Scheduled Sovereign Viewings
                </h2>
                <p className="text-xs text-[#75777a]">
                  Confidential walkthroughs accompanied by Senior Sovereign Advisor and structural architects
                </p>
              </div>

              <div className="space-y-3">
                {viewings.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white p-5 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#5a1645]">{v.id}</span>
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                          v.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <h4 className="font-editorial text-base font-medium text-[#1f2428]">
                        {v.propertyTitle}
                      </h4>
                      <p className="text-xs text-[#666]">
                        {v.notes || 'Rolls-Royce chauffeur transport provided upon request.'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#444] pt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#c5a880]" /> {v.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#c5a880]" /> {v.time}
                        </span>
                        <span className="text-[#888]">Advisor: {v.agentName}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <a
                        href="https://wa.me/971508429110"
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#f4f2ee] hover:bg-[#eae6df] text-xs font-semibold text-[#1f2428] rounded-[2px] transition-colors inline-block text-center"
                      >
                        Direct Concierge WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request New Viewing Form */}
            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm">
              <span className="label-caps text-[#5a1645] text-[10px]">Private Tour Mandate</span>
              <h3 className="font-editorial text-xl font-medium text-[#1f2428] mt-1 mb-4">
                Book a Private Viewing
              </h3>

              {viewingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-[2px] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Viewing request confirmed! Our concierge will coordinate security protocol.
                </div>
              )}

              <form onSubmit={handleBookViewing} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                    Select Residence
                  </label>
                  <select
                    value={selectedPropertyIdForViewing}
                    onChange={(e) => setSelectedPropertyIdForViewing(e.target.value)}
                    className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none focus:border-[#5a1645]"
                  >
                    {PROPERTIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                      Date
                    </label>
                    <input
                      type="date"
                      value={viewingDate}
                      onChange={(e) => setViewingDate(e.target.value)}
                      className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none focus:border-[#5a1645]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                      Time Window
                    </label>
                    <select
                      value={viewingTime}
                      onChange={(e) => setViewingTime(e.target.value)}
                      className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none focus:border-[#5a1645]"
                    >
                      <option>10:00 GST (Morning Light)</option>
                      <option>14:00 GST (Midday Architectural)</option>
                      <option>16:00 GST (Golden Hour Twilight)</option>
                      <option>18:00 GST (Sunset & Evening Lighting)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                    Special Arrangements
                  </label>
                  <textarea
                    rows={3}
                    value={viewingNotes}
                    onChange={(e) => setViewingNotes(e.target.value)}
                    placeholder="Helipad clearance, yacht mooring inspection, NDA signing prior to arrival..."
                    className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none focus:border-[#5a1645]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1f2428] text-[#c5a880] font-bold uppercase tracking-wider rounded-[2px] hover:bg-[#121517] transition-colors"
                >
                  Confirm Viewing Protocol
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* 5. MORTGAGE / EMI CALCULATOR */}
      {activeTab === 'emi' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Sovereign Mortgage & Private Financing Simulator
            </h2>
            <p className="text-xs text-[#75777a]">
              Calculated in real-time according to UAE Central Bank prime lending guidelines and private banking rates
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Controls */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-6">
              
              {/* Property Value Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#1f2428] uppercase tracking-wider">
                    Total Property Valuation (AED)
                  </label>
                  <span className="font-editorial text-lg font-bold text-[#1f2428]">
                    {formatCurrency(loanPrincipalAED, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min={20000000}
                  max={300000000}
                  step={5000000}
                  value={loanPrincipalAED}
                  onChange={(e) => setLoanPrincipalAED(Number(e.target.value))}
                  className="w-full accent-[#5a1645] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#888] mt-1">
                  <span>AED 20M</span>
                  <span>AED 150M</span>
                  <span>AED 300M+</span>
                </div>
              </div>

              {/* Down Payment Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#1f2428] uppercase tracking-wider">
                    Down Payment Percentage ({downPaymentPercent}%)
                  </label>
                  <span className="font-editorial text-base font-bold text-emerald-700">
                    {formatCurrency(downPaymentAED, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-[#5a1645] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#888] mt-1">
                  <span>20% (Minimum LTV limit)</span>
                  <span>30% Standard</span>
                  <span>60% Conservative</span>
                </div>
              </div>

              {/* Interest Rate & Tenure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f2428] uppercase tracking-wider mb-2">
                    Fixed Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="3.0"
                    max="9.0"
                    value={interestRatePercent}
                    onChange={(e) => setInterestRatePercent(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-[#5a1645]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f2428] uppercase tracking-wider mb-2">
                    Financing Tenure (Years)
                  </label>
                  <select
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs font-semibold focus:outline-none focus:border-[#5a1645]"
                  >
                    <option value={5}>5 Years (Short-term Bridge)</option>
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years (Standard Prime)</option>
                    <option value={25}>25 Years (Max UAE Tenure)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#f8f6f2] rounded-[3px] border border-[#e2dcd3] text-[11px] text-[#666] leading-relaxed">
                <strong>DLD & Transaction Regulatory Costs:</strong> Includes 4% Dubai Land Department transfer fee, 0.25% mortgage registration fee, and AED 4,200 trustee registration fees.
              </div>
            </div>

            {/* Results Card */}
            <div className="lg:col-span-5 bg-[#1f2428] text-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/40 shadow-xl flex flex-col justify-between">
              <div>
                <span className="label-caps text-[#c5a880] text-[10px]">Installment Breakdown</span>
                <h3 className="font-editorial text-2xl font-medium mt-1 mb-6">
                  Financing Summary
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-white/5 rounded-[3px] border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-[#c5a880] block font-bold">Monthly Obligation</span>
                    <span className="text-3xl font-editorial font-bold text-white block mt-1">
                      {formatCurrency(monthlyInstallmentAED, currency)}
                    </span>
                    <span className="text-[11px] text-[#8e9092]">per calendar month for {tenureYears} years</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[#8e9092]">Net Borrowed Capital:</span>
                    <span className="font-semibold">{formatCurrency(netLoanAmountAED, currency)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[#8e9092]">Client Equity Required:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(downPaymentAED, currency)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-[#8e9092]">Est. DLD Transfer Fee (4%):</span>
                    <span className="font-semibold">{formatCurrency(loanPrincipalAED * 0.04, currency)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  onClick={onOpenAIAssistant}
                  className="w-full py-3 bg-[#5a1645] hover:bg-[#471237] text-white font-bold uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ffd8eb]" />
                  <span>Request Private Banking Introduction</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. CLIENT PROFILE & KYC */}
      {activeTab === 'profile' && profile && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Sovereign Client Credentials
            </h2>
            <p className="text-xs text-[#75777a]">
              Confidential identity profile, accredited investor classification, and compliance clearances
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-4 text-xs">
              <h3 className="font-editorial text-lg font-medium text-[#1f2428] pb-2 border-b border-[#eee]">
                Personal & Mandate Details
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-[#888] block text-[10px] uppercase">Client Full Name</span>
                  <span className="text-sm font-semibold text-[#1f2428]">{profile.name}</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px] uppercase">Primary Email</span>
                  <span className="text-sm font-mono text-[#1f2428]">{profile.email}</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px] uppercase">Encrypted Phone / WhatsApp</span>
                  <span className="text-sm font-mono text-[#1f2428]">{profile.phone}</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px] uppercase">Nationality & Jurisdiction</span>
                  <span className="text-sm font-medium text-[#1f2428]">{profile.nationality}</span>
                </div>
                <div>
                  <span className="text-[#888] block text-[10px] uppercase">Investor Tier</span>
                  <span className="inline-block px-2.5 py-1 bg-[#5a1645]/10 text-[#5a1645] rounded-[2px] font-bold text-[11px] mt-1">
                    {profile.investorTier}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-4 text-xs">
              <h3 className="font-editorial text-lg font-medium text-[#1f2428] pb-2 border-b border-[#eee]">
                Compliance & Clearance Status
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[2px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-emerald-950 block">DIFC KYC / AML Clearance</span>
                      <span className="text-[10px] text-emerald-700">Validated through WorldCheck (Ref: #CH-P-88492019)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Passed
                  </span>
                </div>

                <div className="p-3 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1f2428] block">Proof of Sovereign Funds</span>
                    <span className="text-[10px] text-[#777]">Certified by Mirabaud Private Bank Zurich</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>

                <div className="p-3 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#1f2428] block">10-Year UAE Golden Visa</span>
                    <span className="text-[10px] text-[#777]">Pre-cleared with Dubai Land Department</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a1645] bg-[#5a1645]/10 px-2 py-0.5 rounded">
                    Eligible
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#888] italic">
                All records are protected under UAE Federal Law No. 45 on Personal Data Protection.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
