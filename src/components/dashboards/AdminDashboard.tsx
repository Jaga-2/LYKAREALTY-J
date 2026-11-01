import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  BarChart2,
  Calendar,
  MessageCircle,
  Phone,
  Video,
  Award,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { crmApi } from '../../services/api/crmApi';
import { Lead, ActivityRecord, ViewingAppointment, StaffMember, DealTransaction } from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { currency } = useCurrency();

  const [activeTab, setActiveTab] = useState<'leads' | 'pipeline' | 'activity' | 'performance'>('leads');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<StaffMember[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);
  const [transactions, setTransactions] = useState<DealTransaction[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterTemp, setFilterTemp] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allLeads = await crmApi.getLeads();
    setLeads(allLeads);
    const staffAgents = await crmApi.getStaff('sales_agent');
    setAgents(staffAgents);
    const allActivities = await crmApi.getActivities();
    setActivities(allActivities);
    const allViewings = await crmApi.getViewings();
    setViewings(allViewings);
    const allTx = await crmApi.getTransactions();
    setTransactions(allTx);
  };

  const handleReassign = async (leadId: string, newAgentId: string) => {
    const updated = await crmApi.reassignLead(leadId, newAgentId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    setReassignSuccessMsg(`Lead ${updated.clientName} successfully reassigned to ${updated.assignedAgentName}`);
    setTimeout(() => setReassignSuccessMsg(null), 4000);
  };

  // Metrics
  const totalLeads = leads.length;
  const overdueCount = leads.filter((l) => l.isOverdue).length;
  const hotCount = leads.filter((l) => l.leadTemperature === 'hot').length;
  const wonDeals = leads.filter((l) => l.status === 'won').length;
  const lostDeals = leads.filter((l) => l.status === 'lost').length;

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      !searchQuery ||
      l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.requirements.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.assignedAgentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSource = filterSource === 'all' || l.source === filterSource;
    const matchTemp = filterTemp === 'all' || l.leadTemperature === filterTemp;
    const matchAgent = filterAgent === 'all' || l.assignedAgentId === filterAgent;
    const matchOverdue = !filterOverdueOnly || l.isOverdue;

    return matchSearch && matchSource && matchTemp && matchAgent && matchOverdue;
  });

  // Pipeline Grouping
  const pipelineStages: { stage: Lead['status']; title: string; color: string }[] = [
    { stage: 'new', title: 'New Intake', color: 'border-slate-300' },
    { stage: 'contacted', title: 'Advisory Contacted', color: 'border-blue-300' },
    { stage: 'viewing_scheduled', title: 'Viewing Scheduled', color: 'border-amber-400' },
    { stage: 'negotiation', title: 'In Negotiation', color: 'border-purple-400' },
    { stage: 'under_contract', title: 'Under Contract (SPA)', color: 'border-indigo-400' },
    { stage: 'won', title: 'Closed / Won', color: 'border-emerald-500' }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-[#1f2428] rounded-[4px] border border-[#c5a880]/30 p-6 sm:p-8 text-white mb-8 relative shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img src="/assets/lyka-original-logo.png" alt="LYKA Realty logo" className="h-10 w-auto object-contain bg-white/5 rounded-[2px] p-1.5 border border-[#c5a880]/30" />
              <span className="label-caps text-[#C5A46D] text-[10px] uppercase font-bold tracking-widest">
                Brokerage Operations Desk
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#477A65] text-white text-[10px] font-bold uppercase tracking-wider">
                Authorized Admin: {currentUser?.name || 'Operations Lead'} (Seat 1 of 2)
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-wide">
              Operations & 25-Agent Lead Allocation Desk
            </h1>

            <p className="text-xs sm:text-sm text-[#dadad8] font-light max-w-2xl leading-relaxed">
              Global inquiry routing, 25 sales agent workload monitoring, referral intelligence, and deals pipeline governance across Dubai residential sectors.
            </p>
          </div>

          {/* Quick Admin KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/40 p-4 rounded-[3px] border border-[#c5a880]/20 text-xs shrink-0">
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Total Active Inquiries</span>
              <span className="text-base font-bold text-white">{totalLeads} Leads</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Overdue Follow-ups</span>
              <span className="text-base font-bold text-rose-400">{overdueCount} Alerts</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Hot Mandates</span>
              <span className="text-base font-bold text-[#ffd8eb]">{hotCount} Deals</span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Consultant Roster</span>
              <span className="text-base font-bold text-emerald-400">{agents.length} / 25 Agents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#c5a880]/30 mb-8 overflow-x-auto bg-white rounded-t-[4px] px-2 shadow-sm">
        {[
          { key: 'leads', label: `Global Intake & Reassignment (${totalLeads})`, icon: <Users className="w-4 h-4" /> },
          { key: 'pipeline', label: 'Mandate Pipeline & Deal Stages', icon: <GitPullRequest className="w-4 h-4" /> },
          { key: 'activity', label: `Agent Activity & Call Logs (${activities.length})`, icon: <Clock className="w-4 h-4" /> },
          { key: 'performance', label: 'Advisory Performance & Velocity', icon: <BarChart2 className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 py-4 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#2c4c3b] text-[#2c4c3b] bg-[#f4f8f5]'
                : 'border-transparent text-[#666] hover:text-[#1f2428] hover:bg-[#faf9f7]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {reassignSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-[2px] mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {reassignSuccessMsg}
        </div>
      )}

      {/* 1. GLOBAL INTAKE & REASSIGNMENT */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#888] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by client name, assigned advisor, notes, source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none"
                />
              </div>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="py-2 px-3 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none"
              >
                <option value="all">All Lead Sources</option>
                <option value="LYKA Editorial Web">LYKA Editorial Web</option>
                <option value="Private Referral">Private Referral</option>
                <option value="Sovereign Concierge">Sovereign Concierge</option>
                <option value="WhatsApp Direct">WhatsApp Direct</option>
              </select>

              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="py-2 px-3 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] text-xs focus:outline-none"
              >
                <option value="all">All Assigned Advisors</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilterOverdueOnly((prev) => !prev)}
                className={`py-2 px-3 rounded-[2px] text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  filterOverdueOnly
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-white text-[#666] border-[#ddd] hover:border-[#999]'
                }`}
              >
                ⚠️ Overdue Follow-ups Only ({overdueCount})
              </button>
            </div>
          </div>

          {/* Master Leads Table */}
          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Client & Contact</th>
                    <th className="py-3 px-4">Mandate Typology</th>
                    <th className="py-3 px-4">Source & Referral</th>
                    <th className="py-3 px-4">Budget Range</th>
                    <th className="py-3 px-4">Temperature</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Assigned Sales Agent</th>
                    <th className="py-3 px-4 text-right">Reassign Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1f2428]">{lead.clientName}</div>
                        <div className="text-[11px] text-[#777]">{lead.email} · {lead.phone}</div>
                        {lead.isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded mt-0.5">
                            Overdue follow-up
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-1.5 py-0.5 bg-[#1f2428] text-[#c5a880] rounded-[2px] font-bold text-[10px] uppercase">
                          {lead.roleType}
                        </span>
                        <div className="text-[11px] text-[#555] mt-1 max-w-[150px] truncate">
                          {lead.propertyTitle || lead.requirements.enclaves.join(', ')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#1f2428] block">{lead.source}</span>
                        {lead.referralDetails && (
                          <span className="text-[10px] text-[#777] block line-clamp-1 italic">
                            Ref: {lead.referralDetails}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#1f2428]">
                        {formatCurrency(lead.requirements.budgetMinAED, currency)}
                        <span className="text-[#888] font-normal block text-[10px]">
                          to {formatCurrency(lead.requirements.budgetMaxAED, currency)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {lead.leadTemperature === 'hot' && (
                          <span className="px-2 py-0.5 rounded-[2px] bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-rose-600 fill-current" /> Hot
                          </span>
                        )}
                        {lead.leadTemperature === 'warm' && (
                          <span className="px-2 py-0.5 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">
                            Warm
                          </span>
                        )}
                        {lead.leadTemperature === 'cold' && (
                          <span className="px-2 py-0.5 rounded-[2px] bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold uppercase">
                            Cold
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[11px] uppercase tracking-wider text-[#5a1645]">
                        {lead.status.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#1f2428]">{lead.assignedAgentName}</div>
                        <span className="text-[10px] text-[#888]">ID: {lead.assignedAgentId}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={lead.assignedAgentId}
                          onChange={(e) => handleReassign(lead.id, e.target.value)}
                          className="py-1 px-2 text-[11px] font-medium bg-[#faf9f7] border border-[#c5a880]/40 rounded-[2px] text-[#1f2428] focus:outline-none cursor-pointer"
                        >
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              Reassign to: {ag.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PIPELINE KANBAN */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Deal Velocity & Mandate Pipeline
            </h2>
            <p className="text-xs text-[#75777a]">
              Stage-by-stage visualization of active buyers, confidential sellers, and sovereign leases
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {pipelineStages.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage.stage);
              return (
                <div key={stage.stage} className="bg-white rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col">
                  <div className={`p-3 border-b-2 bg-[#faf9f7] ${stage.color}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-[#1f2428]">
                      <span>{stage.title}</span>
                      <span className="w-5 h-5 rounded-full bg-[#1f2428] text-[#c5a880] text-[10px] flex items-center justify-center">
                        {stageLeads.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[300px]">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 bg-white rounded-[2px] border border-[#eee] hover:border-[#c5a880] transition-colors shadow-xs space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="truncate max-w-[110px] text-[#1f2428]">{lead.clientName}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-[#1f2428] text-[#c5a880]">
                            {lead.roleType}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#666] line-clamp-1">{lead.propertyTitle || lead.requirements.notes}</p>
                        <div className="pt-1 text-[10px] text-[#888] flex items-center justify-between">
                          <span>{lead.assignedAgentName.split(' ')[0]}</span>
                          <span className="font-semibold text-[#5a1645]">
                            {formatCurrency(lead.requirements.budgetMinAED, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. AGENT ACTIVITY FEED */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Real-Time Brokerage Comms & Interaction Stream
              </h2>
              <p className="text-xs text-[#75777a]">
                Live feed of calls, WhatsApp notes, video meetings, and walkthrough minutes logged across all advisors
              </p>
            </div>
            <span className="text-xs font-semibold text-[#2c4c3b] bg-[#2c4c3b]/10 px-3 py-1 rounded-[2px]">
              {activities.length} Total Logs
            </span>
          </div>

          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="bg-white p-5 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[2px] bg-[#1f2428] text-[#c5a880] text-[10px] font-bold uppercase tracking-wider">
                      {act.type.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-xs text-[#1f2428]">{act.outcome}</span>
                    <span className="text-[10px] text-[#888]">by {act.agentName}</span>
                  </div>
                  <p className="text-xs text-[#555] leading-relaxed max-w-3xl">{act.notes}</p>
                  <div className="text-[10px] text-[#888] flex items-center gap-3 pt-1">
                    <span>Logged at {act.timestamp}</span>
                    {act.durationMinutes && <span>Duration: {act.durationMinutes} mins</span>}
                    <span>Lead ID: {act.leadId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ADVISOR PERFORMANCE & VELOCITY */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Sales Advisory Performance & Leaderboard
            </h2>
            <p className="text-xs text-[#75777a]">
              Volume closed YTD, active client allocations, conversion velocity, and commission tiers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((ag) => (
              <div
                key={ag.id}
                className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={ag.avatar}
                      alt={ag.name}
                      className="w-14 h-14 rounded-[2px] object-cover border border-[#c5a880]/40"
                    />
                    <div>
                      <h3 className="font-editorial text-lg font-medium text-[#1f2428]">{ag.name}</h3>
                      <p className="text-xs text-[#75777a]">{ag.title}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {ag.commissionRatePercent}% Split Tier
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-4 border-t border-[#eee]">
                    <div className="flex justify-between">
                      <span className="text-[#666]">Deals Closed YTD:</span>
                      <span className="font-bold text-[#1f2428]">{ag.dealsClosedYTD} Transactions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Total Volume Closed:</span>
                      <span className="font-bold text-[#5a1645]">{formatCurrency(ag.totalVolumeAED, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Currently Assigned Leads:</span>
                      <span className="font-semibold">{ag.assignedLeadsCount} Mandates</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Base Salary:</span>
                      <span className="font-mono text-[#444]">{formatCurrency(ag.baseSalaryAED, currency)} / mo</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#eee]">
                  <span className="text-[10px] text-[#888] block mb-1">Assigned Enclave Focus</span>
                  <span className="text-xs font-semibold text-[#1f2428]">
                    Palm Jumeirah · Jumeirah Bay · Emirates Hills
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
