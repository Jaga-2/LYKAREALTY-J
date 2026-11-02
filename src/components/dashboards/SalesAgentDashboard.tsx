import React, { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../../lib/api';
import {
  Briefcase,
  Phone,
  MessageCircle,
  Video,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  DollarSign,
  ChevronRight,
  User,
  Building,
  Eye,
  Award,
  ListChecks,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { crmApi } from '../../services/api/crmApi';
import { Lead, ActivityRecord, ViewingAppointment, StaffMember } from '../../services/mockData';
import { PROPERTIES } from '../../data/properties';
import { formatCurrency } from '../../utils/currency';

export const SalesAgentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { currency } = useCurrency();

  // The agent only sees leads assigned to them!
  const agentId = currentUser?.id || 'agent-01';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);
  const [agentProfile, setAgentProfile] = useState<StaffMember | null>(null);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterRoleType, setFilterRoleType] = useState<string>('all');
  const [filterTemperature, setFilterTemperature] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFollowUp, setFilterFollowUp] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'callback'>('all');

  // Log Activity Form
  const [newActivityType, setNewActivityType] = useState<'call' | 'whatsapp' | 'video_meeting'>('call');
  const [newActivityOutcome, setNewActivityOutcome] = useState<'Connected' | 'No Answer' | 'Busy' | 'Callback Requested' | 'Not Interested' | 'Invalid Contact' | string>('Connected');
  const [newActivityNotes, setNewActivityNotes] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState<number>(15);
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>('');
  const [newFollowUpTime, setNewFollowUpTime] = useState<string>('15:00');
  const [isActivitySaved, setIsActivitySaved] = useState(false);

  // Property Recommendation Form
  const [recommendedPropId, setRecommendedPropId] = useState<string>(PROPERTIES[0].id);
  const [recSuccess, setRecSuccess] = useState(false);

  // Lead Checklist state (per-lead, fetched from API)
  const [checklist, setChecklist] = useState<any[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadChecklist = useCallback(async (leadId: string) => {
    setChecklistLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/crm/checklist/${leadId}`), {
        headers: { 'x-session-token': sessionStorage.getItem('lyka_session_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setChecklist(data);
      }
    } catch {
      // fallback: show empty checklist
      setChecklist([]);
    } finally {
      setChecklistLoading(false);
    }
  }, []);

  const handleToggleStep = async (stepKey: string, currentValue: boolean) => {
    if (!selectedLead) return;
    const newValue = !currentValue;
    // Optimistic update
    setChecklist((prev) =>
      prev.map((s) => (s.stepKey === stepKey ? { ...s, isCompleted: newValue } : s))
    );
    try {
      await fetch(apiUrl(`/api/crm/checklist/${selectedLead.id}/${stepKey}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionStorage.getItem('lyka_session_token') || ''
        },
        body: JSON.stringify({ isCompleted: newValue })
      });
    } catch {
      // revert on failure
      setChecklist((prev) =>
        prev.map((s) => (s.stepKey === stepKey ? { ...s, isCompleted: currentValue } : s))
      );
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/notifications?unread=true'), {
        headers: { 'x-session-token': sessionStorage.getItem('lyka_session_token') || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // silent fail
    }
  }, []);

  const handleMarkNotifRead = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: { 'x-session-token': sessionStorage.getItem('lyka_session_token') || '' }
      });
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadData();
    loadNotifications();
  }, [agentId]);

  const loadData = async () => {
    const agentLeads = await crmApi.getLeads(agentId);
    setLeads(agentLeads);
    if (agentLeads.length > 0 && !selectedLead) {
      setSelectedLead(agentLeads[0]);
      loadChecklist(agentLeads[0].id);
    }
    const acts = await crmApi.getActivities(undefined, agentId);
    setActivities(acts);
    const views = await crmApi.getViewings(agentId);
    setViewings(views);
    const staffList = await crmApi.getStaff('sales_agent');
    const profile = staffList.find((s) => s.id === agentId) || staffList[0];
    setAgentProfile(profile);
  };

  const handleUpdateStatus = async (leadId: string, status: Lead['status']) => {
    const updated = await crmApi.updateLeadStatus(leadId, status);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLead?.id === leadId) setSelectedLead(updated);
  };

  const handleUpdateTemperature = async (leadId: string, temp: Lead['leadTemperature']) => {
    const updated = await crmApi.updateLeadTemperature(leadId, temp);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLead?.id === leadId) setSelectedLead(updated);
  };

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newActivityOutcome) return;

    const nextFollowUp = newFollowUpDate ? `${newFollowUpDate} ${newFollowUpTime}` : undefined;

    const act = await crmApi.logActivity({
      leadId: selectedLead.id,
      agentId: agentId,
      agentName: currentUser?.name || 'Rashid Al-Falasi',
      type: newActivityType,
      outcome: newActivityOutcome,
      notes: newActivityNotes,
      durationMinutes: newActivityType === 'call' || newActivityType === 'video_meeting' ? newActivityDuration : undefined,
      meetingLink: newActivityType === 'video_meeting' ? 'https://meet.google.com/lyka-private-briefing' : undefined,
      nextFollowUpScheduled: nextFollowUp
    });

    setActivities((prev) => [act, ...prev]);

    // Reload leads to reflect updated lastContactedAt and nextFollowUpDate
    const reloaded = await crmApi.getLeads(agentId);
    setLeads(reloaded);
    const updatedSelected = reloaded.find((l) => l.id === selectedLead.id);
    if (updatedSelected) setSelectedLead(updatedSelected);

    setNewActivityNotes('');
    setNewFollowUpDate('');
    setIsActivitySaved(true);
    setTimeout(() => setIsActivitySaved(false), 3500);
  };

  const handleSendRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = PROPERTIES.find((p) => p.id === recommendedPropId);
    if (!prop || !selectedLead) return;

    // Log recommendation as activity
    crmApi.logActivity({
      leadId: selectedLead.id,
      agentId: agentId,
      agentName: currentUser?.name || 'Rashid Al-Falasi',
      type: 'whatsapp',
      outcome: `Curated Recommendation: ${prop.title}`,
      notes: `Dispatched confidential digital portfolio dossier for ${prop.title} (${prop.location}) valued at ${formatCurrency(prop.priceAED, 'AED')}.`
    }).then((act) => setActivities((prev) => [act, ...prev]));

    setRecSuccess(true);
    setTimeout(() => setRecSuccess(false), 3000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = leads.filter((l) => l.isOverdue || (l.nextFollowUpDate && l.nextFollowUpDate < todayStr && l.status !== 'won' && l.status !== 'lost')).length;
  const todayCount = leads.filter((l) => l.nextFollowUpDate === todayStr).length;

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchRole = filterRoleType === 'all' || lead.roleType === filterRoleType;
    const matchTemp = filterTemperature === 'all' || lead.leadTemperature === filterTemperature;
    const matchSearch =
      !searchQuery ||
      lead.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.requirements.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.propertyTitle && lead.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchFollowUp = true;
    if (filterFollowUp === 'today') {
      matchFollowUp = lead.nextFollowUpDate === todayStr;
    } else if (filterFollowUp === 'overdue') {
      matchFollowUp = !!lead.isOverdue || (!!lead.nextFollowUpDate && lead.nextFollowUpDate < todayStr && lead.status !== 'won' && lead.status !== 'lost');
    } else if (filterFollowUp === 'upcoming') {
      matchFollowUp = !!lead.nextFollowUpDate && lead.nextFollowUpDate > todayStr;
    } else if (filterFollowUp === 'callback') {
      matchFollowUp = lead.preferredCallbackTime.length > 0;
    }

    return matchRole && matchTemp && matchSearch && matchFollowUp;
  });

  const selectedLeadActivities = activities.filter((a) => a.leadId === selectedLead?.id);
  const selectedLeadViewings = viewings.filter((v) => v.leadId === selectedLead?.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-[#1f2428] rounded-[4px] border border-[#c5a880]/30 p-6 sm:p-8 text-white mb-8 relative shadow-xl">
        {/* Notifications Bell */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Bell className="w-5 h-5 text-[#c5a880]" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
          {showNotifications && notifications.length > 0 && (
            <div className="absolute right-0 top-10 w-80 bg-white shadow-2xl rounded-[3px] border border-[#c5a880]/30 z-50 overflow-hidden">
              <div className="p-3 bg-[#1f2428] text-[#c5a880] text-xs font-bold uppercase tracking-wider">
                New Notifications ({notifications.length})
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#eee]">
                {notifications.map((n: any) => (
                  <div key={n.id} className="p-3 text-xs hover:bg-[#faf9f7] flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-[#1f2428] mb-0.5">{n.title}</p>
                      <p className="text-[#666] leading-relaxed">{n.message}</p>
                      <p className="text-[#999] text-[10px] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkNotifRead(n.id)}
                      className="shrink-0 text-[10px] text-[#5a1645] font-semibold hover:underline"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img src="/assets/lyka-original-logo.png" alt="LYKA Realty logo" className="h-10 w-auto object-contain bg-white/5 rounded-[2px] p-1.5 border border-[#c5a880]/30" />
              <span className="label-caps text-[#c5a880] text-[10px]">Sales Advisory Workspace</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#5a1645] text-white text-[10px] font-bold uppercase tracking-wider">
                Agent ID: {agentId}
              </span>
              <span className="text-[11px] text-[#ffd8eb] bg-[#5a1645]/40 border border-[#c5a880]/30 px-2 py-0.5 rounded-[2px]">
                Strict Data Isolation: Only Assigned Leads Visible
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-wide">
              {currentUser?.name || 'Rashid Al-Falasi'} — Private Advisory Desk
            </h1>

            <p className="text-xs sm:text-sm text-[#dadad8] font-light max-w-2xl leading-relaxed">
              Manage confidential buyer mandates, seller listings, scheduled walkthroughs, and deal pipelines across Palm Jumeirah and ultra-prime enclaves.
            </p>
          </div>

          {/* Performance Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 p-4 rounded-[3px] border border-[#c5a880]/20 text-xs shrink-0">
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Active Leads</span>
              <span className="text-base font-bold text-white">{leads.length} Clients</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Deals Closed YTD</span>
              <span className="text-base font-bold text-[#ffd8eb]">14 Transactions</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Volume YTD</span>
              <span className="text-base font-bold text-[#c5a880]">AED 485M</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Commission Split</span>
              <span className="text-base font-bold text-emerald-400">45% Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Lead List vs Lead Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Assigned Leads (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#888] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search assigned clients, notes, estates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none focus:border-[#5a1645]"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterRoleType}
                onChange={(e) => setFilterRoleType(e.target.value)}
                className="flex-1 py-1.5 px-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none"
              >
                <option value="all">All Mandates (Buyer/Seller/Tenant)</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="tenant">Tenants</option>
              </select>

              <select
                value={filterTemperature}
                onChange={(e) => setFilterTemperature(e.target.value)}
                className="flex-1 py-1.5 px-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none"
              >
                <option value="all">All Temperatures</option>
                <option value="hot">🔥 Hot Only</option>
                <option value="warm">⚡ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>

            {/* Follow-up Quick Navigation Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#c5a880]/15 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterFollowUp('all')}
                className={`px-2 py-1 rounded-[2px] font-semibold transition-all cursor-pointer ${
                  filterFollowUp === 'all'
                    ? 'bg-[#1f2428] text-[#c5a880]'
                    : 'bg-[#f4f2ee] text-[#555] hover:text-[#1f2428]'
                }`}
              >
                All Leads ({leads.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterFollowUp('today')}
                className={`px-2 py-1 rounded-[2px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterFollowUp === 'today'
                    ? 'bg-[#5a1645] text-white'
                    : 'bg-[#f4f2ee] text-[#555] hover:text-[#1f2428]'
                }`}
              >
                <span>Today's</span>
                <span className="px-1 bg-white/20 rounded-[2px] text-[10px]">{todayCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterFollowUp('overdue')}
                className={`px-2 py-1 rounded-[2px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterFollowUp === 'overdue'
                    ? 'bg-rose-700 text-white'
                    : overdueCount > 0
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                    : 'bg-[#f4f2ee] text-[#555]'
                }`}
              >
                <span>Overdue</span>
                {overdueCount > 0 && (
                  <span className="px-1 bg-rose-600 text-white rounded-[2px] text-[10px] font-bold">
                    {overdueCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterFollowUp('upcoming')}
                className={`px-2 py-1 rounded-[2px] font-semibold transition-all cursor-pointer ${
                  filterFollowUp === 'upcoming'
                    ? 'bg-[#1f2428] text-[#c5a880]'
                    : 'bg-[#f4f2ee] text-[#555] hover:text-[#1f2428]'
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setFilterFollowUp('callback')}
                className={`px-2 py-1 rounded-[2px] font-semibold transition-all cursor-pointer ${
                  filterFollowUp === 'callback'
                    ? 'bg-[#1f2428] text-[#c5a880]'
                    : 'bg-[#f4f2ee] text-[#555] hover:text-[#1f2428]'
                }`}
              >
                Callbacks
              </button>
            </div>
          </div>

          {/* Leads Feed */}
          <div className="space-y-3">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => { setSelectedLead(lead); loadChecklist(lead.id); }}
                  className={`p-4 rounded-[3px] border transition-all cursor-pointer relative bg-white ${
                    isSelected
                      ? 'border-[#5a1645] ring-2 ring-[#5a1645]/20 shadow-md bg-[#faf6f8]'
                      : 'border-[#c5a880]/30 hover:border-[#c5a880] shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1f2428]">{lead.clientName}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[2px] bg-[#1f2428] text-[#c5a880]">
                        {lead.roleType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lead.leadTemperature === 'hot' && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-[2px]">
                          <Flame className="w-3 h-3 text-rose-600 fill-current" /> Hot
                        </span>
                      )}
                      {lead.leadTemperature === 'warm' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-[2px]">
                          Warm
                        </span>
                      )}
                      {lead.leadTemperature === 'cold' && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-[2px]">
                          Cold
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#555] line-clamp-1 mb-2">
                    {lead.propertyTitle || lead.requirements.notes}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#777] pt-2 border-t border-[#eee]">
                    <span>
                      Budget: {formatCurrency(lead.requirements.budgetMinAED, currency)} – {formatCurrency(lead.requirements.budgetMaxAED, currency)}
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-[#5a1645]">
                      {lead.status.replace('_', ' ')}
                    </span>
                  </div>

                  {lead.isOverdue && (
                    <div className="mt-2 text-[10px] text-rose-700 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" /> Overdue follow-up needed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Lead Inspection & Action Workbench (7 cols) */}
        <div className="lg:col-span-7">
          {selectedLead ? (
            <div className="space-y-6">
              
              {/* Lead Dossier Header Card */}
              <div className="bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eee]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="label-caps text-[#5a1645] text-[10px]">Client Dossier</span>
                      <span className="text-xs font-mono text-[#888]">ID: {selectedLead.id}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#1f2428] text-white">
                        {selectedLead.roleType}
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                      {selectedLead.clientName}
                    </h2>
                    <p className="text-xs text-[#75777a]">{selectedLead.email} · {selectedLead.phone}</p>
                  </div>

                  {/* Temperature & Deal Status Controls */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-[#888]">Temperature:</span>
                      {(['hot', 'warm', 'cold'] as Lead['leadTemperature'][]).map((temp) => (
                        <button
                          key={temp}
                          onClick={() => handleUpdateTemperature(selectedLead.id, temp)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded-[2px] border transition-all ${
                            selectedLead.leadTemperature === temp
                              ? 'bg-[#1f2428] text-[#c5a880] border-[#c5a880]'
                              : 'bg-white text-[#666] border-[#ddd] hover:border-[#999]'
                          }`}
                        >
                          {temp}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold text-[#888]">Deal Stage:</span>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value as any)}
                        className="py-1 px-2 text-xs font-semibold bg-[#faf9f7] border border-[#c5a880]/40 rounded-[2px] text-[#5a1645] focus:outline-none"
                      >
                        <option value="new">New Inquiry</option>
                        <option value="contacted">Contacted</option>
                        <option value="viewing_scheduled">Viewing Scheduled</option>
                        <option value="negotiation">In Negotiation</option>
                        <option value="under_contract">Under Contract (SPA)</option>
                        <option value="won">Closed / Won</option>
                        <option value="lost">Archived / Lost</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Requirements & Mandate Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#888] block text-[10px] uppercase font-semibold mb-1">
                      Budget Range (AED)
                    </span>
                    <span className="font-semibold text-sm text-[#1f2428]">
                      {formatCurrency(selectedLead.requirements.budgetMinAED, currency)} – {formatCurrency(selectedLead.requirements.budgetMaxAED, currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#888] block text-[10px] uppercase font-semibold mb-1">
                      Preferred Callback Window
                    </span>
                    <span className="font-medium text-xs text-[#5a1645] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {selectedLead.preferredCallbackTime}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#888] block text-[10px] uppercase font-semibold mb-1">
                      Target Enclaves
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedLead.requirements.enclaves.map((enc, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#f4f2ee] rounded-[2px] text-[11px] text-[#333]">
                          {enc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#888] block text-[10px] uppercase font-semibold mb-1">
                      Property Typologies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedLead.requirements.propertyTypes.map((typ, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[#f4f2ee] rounded-[2px] text-[11px] text-[#333]">
                          {typ}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mandate Notes */}
                <div className="p-3 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/20 text-xs text-[#444] leading-relaxed">
                  <span className="font-semibold text-[#1f2428] block mb-1">Confidential Client Mandate Notes:</span>
                  {selectedLead.requirements.notes}
                </div>

                {/* Quick Comms Action Strip */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#eee]">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 py-2 px-3 bg-[#1f2428] text-[#c5a880] rounded-[2px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#121517] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Client</span>
                  </a>

                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-[#25D366] text-white rounded-[2px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#20b858] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 bg-[#5a1645] text-white rounded-[2px] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#471237] transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Meet</span>
                  </a>
                </div>
              </div>

              {/* Action Tabs: 1) Checklist | 2) Log Interaction | 3) Recommend Residence | 4) Viewings */}
              <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-6">

                {/* 0. Sales Call Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-editorial text-lg font-medium text-[#1f2428] flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-[#5a1645]" /> Sales Call Checklist
                    </h3>
                    <span className="text-[10px] text-[#888]">
                      {checklist.filter((s) => s.isCompleted).length}/{checklist.length} completed
                    </span>
                  </div>
                  {checklistLoading ? (
                    <p className="text-xs text-[#888] italic">Loading checklist…</p>
                  ) : checklist.length === 0 ? (
                    <p className="text-xs text-[#888] italic">
                      Select a lead to view the call checklist.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {checklist.map((step, idx) => (
                        <button
                          key={step.stepKey || idx}
                          type="button"
                          onClick={() => handleToggleStep(step.stepKey, step.isCompleted)}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-[2px] border text-left text-xs transition-all ${
                            step.isCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-[#faf9f7] border-[#c5a880]/20 text-[#444] hover:border-[#c5a880]/60'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            step.isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-[#bbb] bg-white'
                          }`}>
                            {step.isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </span>
                          <span className={`flex-1 ${step.isCompleted ? 'line-through opacity-60' : ''}`}>
                            <span className="font-semibold text-[10px] text-[#999] mr-1.5">{idx + 1}.</span>
                            {step.stepLabel}
                          </span>
                          {step.isCompleted && step.completedByName && (
                            <span className="text-[9px] text-[#999] shrink-0">{step.completedByName}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Progress bar */}
                  {checklist.length > 0 && (
                    <div className="mt-3 h-1.5 bg-[#eee] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(checklist.filter(s => s.isCompleted).length / checklist.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* 1. Log Activity Record */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-editorial text-lg font-medium text-[#1f2428]">
                      Log Client Interaction
                    </h3>
                    <span className="text-[10px] text-[#888]">Stored in chronological CRM feed</span>
                  </div>

                  {isActivitySaved && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-[2px] mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Interaction logged to CRM activity stream!
                    </div>
                  )}

                  <form onSubmit={handleLogActivity} className="space-y-3 text-xs">
                    <div className="flex gap-2">
                      {(['call', 'whatsapp', 'video_meeting'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewActivityType(type)}
                          className={`flex-1 py-2 text-center font-semibold rounded-[2px] border uppercase text-[11px] ${
                            newActivityType === type
                              ? 'bg-[#1f2428] text-[#c5a880] border-[#c5a880]'
                              : 'bg-white text-[#555] border-[#ddd]'
                          }`}
                        >
                          {type === 'call' && '📞 Phone Call'}
                          {type === 'whatsapp' && '💬 WhatsApp'}
                          {type === 'video_meeting' && '📹 Video Meeting'}
                        </button>
                      ))}
                    </div>

                    {/* Standard Call & Interaction Outcomes */}
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1.5">
                        Call / Interaction Outcome
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                        {[
                          { label: 'Connected', icon: '✅' },
                          { label: 'No Answer', icon: '📵' },
                          { label: 'Busy', icon: '⏳' },
                          { label: 'Callback Requested', icon: '📞' },
                          { label: 'Not Interested', icon: '🛑' },
                          { label: 'Invalid Contact', icon: '⚠️' }
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setNewActivityOutcome(opt.label)}
                            className={`py-1.5 px-2 rounded-[2px] text-[11px] font-medium border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                              newActivityOutcome === opt.label
                                ? 'bg-[#1f2428] text-[#c5a880] border-[#c5a880] font-bold shadow-xs'
                                : 'bg-white text-[#555] border-[#ddd] hover:border-[#bbb]'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1">
                          Schedule Next Follow-Up Date
                        </label>
                        <input
                          type="date"
                          value={newFollowUpDate}
                          onChange={(e) => setNewFollowUpDate(e.target.value)}
                          className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1">
                          Follow-Up Time
                        </label>
                        <input
                          type="time"
                          value={newFollowUpTime}
                          onChange={(e) => setNewFollowUpTime(e.target.value)}
                          className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none text-xs"
                        />
                      </div>

                      {newActivityType !== 'whatsapp' ? (
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1">
                            Duration (Minutes)
                          </label>
                          <input
                            type="number"
                            value={newActivityDuration}
                            onChange={(e) => setNewActivityDuration(Number(e.target.value))}
                            className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1">
                            Channel
                          </label>
                          <div className="p-2 bg-[#faf9f7] border border-[#c5a880]/20 rounded-[2px] text-xs text-[#555]">
                            WhatsApp Encrypted
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#888] mb-1">
                        Detailed Meeting Notes & Commitments
                      </label>
                      <textarea
                        rows={3}
                        value={newActivityNotes}
                        onChange={(e) => setNewActivityNotes(e.target.value)}
                        placeholder="Discussed sovereign escrow schedule, private inspection dates, family office clearance..."
                        className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#5a1645] hover:bg-[#471237] text-white font-bold uppercase tracking-wider rounded-[2px] transition-colors"
                    >
                      Commit Interaction Log
                    </button>
                  </form>
                </div>

                {/* 2. Recommend Residence */}
                <div className="pt-6 border-t border-[#eee]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-editorial text-lg font-medium text-[#1f2428]">
                      Dispatch Property Recommendation
                    </h3>
                    <span className="text-[10px] text-[#888]">Suggest curated LYKA portfolio piece</span>
                  </div>

                  {recSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-[2px] mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Dossier dispatched & logged to client activity feed!
                    </div>
                  )}

                  <form onSubmit={handleSendRecommendation} className="flex gap-2 text-xs">
                    <select
                      value={recommendedPropId}
                      onChange={(e) => setRecommendedPropId(e.target.value)}
                      className="flex-1 p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none"
                    >
                      {PROPERTIES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.location}) — {formatCurrency(p.priceAED, 'AED')}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#1f2428] text-[#c5a880] font-bold uppercase tracking-wider rounded-[2px] hover:bg-[#121517] transition-colors shrink-0"
                    >
                      Recommend
                    </button>
                  </form>
                </div>

                {/* 3. History Feed */}
                <div className="pt-6 border-t border-[#eee]">
                  <h3 className="font-editorial text-lg font-medium text-[#1f2428] mb-4">
                    Interaction History & Scheduled Viewings
                  </h3>

                  {selectedLeadActivities.length === 0 ? (
                    <p className="text-xs text-[#888] italic">No interactions logged yet for this client.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedLeadActivities.map((act) => (
                        <div key={act.id} className="p-3 bg-[#faf9f7] rounded-[2px] border border-[#c5a880]/20 text-xs space-y-1">
                          <div className="flex items-center justify-between font-semibold text-[#1f2428]">
                            <span className="flex items-center gap-1.5">
                              {act.type === 'call' && <Phone className="w-3.5 h-3.5 text-[#c5a880]" />}
                              {act.type === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />}
                              {act.type === 'video_meeting' && <Video className="w-3.5 h-3.5 text-[#5a1645]" />}
                              <span>{act.outcome}</span>
                            </span>
                            <span className="text-[10px] text-[#888]">{act.timestamp}</span>
                          </div>
                          <p className="text-[#555] leading-relaxed">{act.notes}</p>
                          {act.meetingLink && (
                            <a
                              href={act.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-[#5a1645] hover:underline flex items-center gap-1 pt-1"
                            >
                              Meeting Link: {act.meetingLink} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-[3px] border border-[#c5a880]/30 space-y-3">
              <User className="w-8 h-8 text-[#c5a880] mx-auto opacity-60" />
              <p className="text-sm text-[#444]">Select an assigned client from the left pane to view details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
