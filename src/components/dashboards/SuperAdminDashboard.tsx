import React, { useState, useEffect } from 'react';
import {
  Crown,
  DollarSign,
  TrendingUp,
  Users,
  ShieldCheck,
  FileCheck,
  Lock,
  Settings,
  AlertOctagon,
  CheckCircle2,
  Building,
  Key,
  Layers,
  Search,
  Plus,
  Eye,
  Sliders,
  Award,
  CreditCard,
  History
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { superAdminApi, SystemConfig } from '../../services/api/superAdminApi';
import { crmApi } from '../../services/api/crmApi';
import {
  StaffMember,
  DealTransaction,
  AuditLogEntry,
  ComplianceDocument
} from '../../services/mockData';
import { formatCurrency } from '../../utils/currency';

export const SuperAdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { currency } = useCurrency();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'transactions' | 'employees' | 'compensation' | 'compliance' | 'audit' | 'security' | 'config'
  >('analytics');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [transactions, setTransactions] = useState<DealTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocument[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  // Compensation edit modal state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newBaseSalary, setNewBaseSalary] = useState<number>(35000);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(45);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Add staff modal state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'sales_agent' | 'admin'>('sales_agent');
  const [staffTitle, setStaffTitle] = useState('');
  const [staffDepartment, setStaffDepartment] = useState('Prime Residential Sales');
  const [staffCode, setStaffCode] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const s = await superAdminApi.getStaff();
    setStaff(s);
    const tx = await crmApi.getTransactions();
    setTransactions(tx);
    const logs = await superAdminApi.getAuditLogs();
    setAuditLogs(logs);
    const docs = await superAdminApi.getComplianceDocs();
    setComplianceDocs(docs);
    const cfg = await superAdminApi.getConfig();
    setConfig(cfg);
  };

  const handleUpdateCommissionStatus = async (txId: string, status: DealTransaction['commissionPaymentStatus']) => {
    const updated = await crmApi.updateCommissionStatus(txId, status);
    setTransactions((prev) => prev.map((t) => (t.id === txId ? updated : t)));
    superAdminApi.logAudit({
      actorName: currentUser?.name || 'Mansour Al-Nahyan',
      actorRole: 'Super Admin',
      action: 'Commission Payout Status Updated',
      target: `Transaction #${txId} marked as ${status.toUpperCase()}`,
      ipAddress: '194.170.82.14',
      severity: 'info'
    });
    showNotice(`Transaction #${txId} payout status set to ${status.toUpperCase()}`);
  };

  const handleSaveCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const updated = await superAdminApi.updateStaffCompensation(editingStaff.id, newBaseSalary, newCommissionRate);
    setStaff((prev) => prev.map((s) => (s.id === editingStaff.id ? updated : s)));
    setEditingStaff(null);
    showNotice(`Compensation terms updated for ${updated.name}`);
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;

    if (staffRole === 'sales_agent') {
      const currentAgents = staff.filter((s) => s.role === 'sales_agent').length;
      if (currentAgents >= 25) {
        alert('Organizational Capacity Limit Reached: Maximum of 25 Sales Agents authorized.');
        return;
      }
    } else if (staffRole === 'admin') {
      const currentAdmins = staff.filter((s) => s.role === 'admin').length;
      if (currentAdmins >= 2) {
        alert('Executive Governance Policy: Exactly 2 Authorized Admin accounts permitted.');
        return;
      }
    }

    const code = staffCode || (staffRole === 'sales_agent' ? `AGT-${String(staff.length + 1).padStart(3, '0')}` : `ADM-0${staff.filter(s => s.role === 'admin').length + 1}`);

    const newMember = await superAdminApi.addStaffMember({
      name: staffName,
      email: staffEmail,
      phone: staffPhone || '+971 4 812 9000',
      role: staffRole,
      title: staffTitle || (staffRole === 'sales_agent' ? 'Private Client Advisor' : 'Operations Manager'),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      baseSalaryAED: staffRole === 'sales_agent' ? 30000 : 45000,
      commissionRatePercent: staffRole === 'sales_agent' ? 40 : 0,
      status: 'active'
    });

    (newMember as any).employeeCode = code;
    (newMember as any).department = staffDepartment;

    setStaff((prev) => [...prev, newMember]);
    setIsAddStaffOpen(false);
    setStaffName('');
    setStaffEmail('');
    setStaffCode('');
    showNotice(`New staff member ${newMember.name} (${code}) onboarding provisioned`);
  };

  const handleUpdateDocStatus = async (docId: string, status: ComplianceDocument['status']) => {
    const updated = await superAdminApi.updateComplianceStatus(docId, status);
    setComplianceDocs((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    showNotice(`Document #${docId} verified status changed to ${status}`);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // High-level Financial Aggregates
  const totalVolumeTransactedAED = transactions.reduce((acc, t) => acc + t.transactionValueAED, 0);
  const totalBrokerageCommissionAED = transactions.reduce((acc, t) => acc + t.brokerageCommissionAED, 0);
  const totalAgentSplitsAED = transactions.reduce((acc, t) => acc + t.agentCommissionSplitAED, 0);
  const netBrokerageProfitAED = totalBrokerageCommissionAED - totalAgentSplitsAED;

  const salesTransactions = transactions.filter((t) => t.type === 'sale');
  const rentalTransactions = transactions.filter((t) => t.type === 'rental');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-[#1f2428] rounded-[4px] border border-[#c5a880]/30 p-6 sm:p-8 text-white mb-8 relative shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9a7833]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="label-caps text-[#ffd8eb] text-[10px]">Managing Partner Office</span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#9a7833] text-white text-[10px] font-bold uppercase tracking-wider">
                Super Admin: {currentUser?.name || 'Mansour Al-Nahyan'}
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-[2px] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Root Access Granted
              </span>
            </div>

            <h1 className="font-editorial text-2xl sm:text-3xl font-medium tracking-wide">
              Executive CRM Governance & Sovereign Financial Ledger
            </h1>

            <p className="text-xs sm:text-sm text-[#dadad8] font-light max-w-2xl leading-relaxed">
              Consolidated transactions ledger, brokerage commission splits, payroll governance, system audit compliance, and enterprise role permissions.
            </p>
          </div>

          {/* Aggregate Financial Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/50 p-4 rounded-[3px] border border-[#c5a880]/30 text-xs shrink-0">
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Total Closed Volume</span>
              <span className="text-base font-editorial font-bold text-[#ffd8eb]">
                {formatCurrency(totalVolumeTransactedAED, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Gross Brokerage Comm.</span>
              <span className="text-base font-editorial font-bold text-[#c5a880]">
                {formatCurrency(totalBrokerageCommissionAED, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Agent Splits Paid</span>
              <span className="text-base font-editorial font-bold text-emerald-400">
                {formatCurrency(totalAgentSplitsAED, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#8e9092] block text-[10px] uppercase">Net Brokerage Retained</span>
              <span className="text-base font-editorial font-bold text-white">
                {formatCurrency(netBrokerageProfitAED, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-[2px] mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionNotice}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#c5a880]/30 mb-8 overflow-x-auto bg-white rounded-t-[4px] px-2 shadow-sm">
        {[
          { key: 'analytics', label: 'Financial Analytics', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'transactions', label: `Transactions & Commissions (${transactions.length})`, icon: <CreditCard className="w-4 h-4" /> },
          { key: 'employees', label: `Staff Directory (${staff.length})`, icon: <Users className="w-4 h-4" /> },
          { key: 'compensation', label: 'Compensation & Splits', icon: <DollarSign className="w-4 h-4" /> },
          { key: 'compliance', label: `Compliance & Title Deeds (${complianceDocs.length})`, icon: <FileCheck className="w-4 h-4" /> },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: <History className="w-4 h-4" /> },
          { key: 'security', label: 'Security & Access Control', icon: <ShieldCheck className="w-4 h-4" /> },
          { key: 'config', label: 'System Configuration', icon: <Settings className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 py-4 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#9a7833] text-[#9a7833] bg-[#fbf9f4]'
                : 'border-transparent text-[#666] hover:text-[#1f2428] hover:bg-[#faf9f7]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. FINANCIAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-3">
              <span className="label-caps text-[#c5a880] text-[10px]">Sales Ledger Summary</span>
              <h3 className="font-editorial text-2xl font-medium text-[#1f2428]">
                {formatCurrency(totalVolumeTransactedAED, currency)}
              </h3>
              <p className="text-xs text-[#75777a]">
                Across {salesTransactions.length} sovereign residential acquisitions (average ticket: {formatCurrency(totalVolumeTransactedAED / (salesTransactions.length || 1), currency)})
              </p>
              <div className="pt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY Volume Expansion
              </div>
            </div>

            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-3">
              <span className="label-caps text-[#5a1645] text-[10px]">Commission Revenue</span>
              <h3 className="font-editorial text-2xl font-medium text-[#5a1645]">
                {formatCurrency(totalBrokerageCommissionAED, currency)}
              </h3>
              <p className="text-xs text-[#75777a]">
                Standard 2.0% acquisition fee on freehold deeds & 5.0% on ultra-luxury leases
              </p>
              <div className="pt-2 text-[11px] text-[#444] flex justify-between">
                <span>Agent Outflow: {formatCurrency(totalAgentSplitsAED, currency)}</span>
                <span className="font-semibold text-emerald-800">Retained: {formatCurrency(netBrokerageProfitAED, currency)}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm space-y-3">
              <span className="label-caps text-[#2c4c3b] text-[10px]">Escrow Liquidity</span>
              <h3 className="font-editorial text-2xl font-medium text-[#2c4c3b]">
                100% Cleared
              </h3>
              <p className="text-xs text-[#75777a]">
                All transacted title deeds verified via Dubai Land Department (DLD) digital escrow registry
              </p>
              <div className="pt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero liens or disputed encumbrances
              </div>
            </div>

          </div>

          {/* Enclave Breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm">
            <h3 className="font-editorial text-xl font-medium text-[#1f2428] mb-4">
              Prime Enclave Transacted Value Distribution
            </h3>
            <div className="space-y-4">
              {[
                { enclave: 'Palm Jumeirah', volumeAED: 245000000, share: '41%' },
                { enclave: 'Jumeirah Bay Island', volumeAED: 185000000, share: '31%' },
                { enclave: 'Emirates Hills', volumeAED: 160000000, share: '27%' },
                { enclave: 'Downtown Dubai & DIFC', volumeAED: 3800000, share: '1%' }
              ].map((item) => (
                <div key={item.enclave} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#1f2428]">{item.enclave}</span>
                    <span className="font-mono text-[#5a1645]">
                      {formatCurrency(item.volumeAED, currency)} ({item.share})
                    </span>
                  </div>
                  <div className="w-full bg-[#f4f2ee] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5a1645] h-full"
                      style={{ width: item.share }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TRANSACTIONS & COMMISSIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Executive Transactions Ledger & Commission Payouts
              </h2>
              <p className="text-xs text-[#75777a]">
                Audited Dubai Land Department deeds, gross brokerage fee, agent splits, and disbursement status
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tx ID & Deed</th>
                    <th className="py-3 px-4">Residence & Enclave</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Closing Value</th>
                    <th className="py-3 px-4">Gross Commission</th>
                    <th className="py-3 px-4">Agent Split</th>
                    <th className="py-3 px-4">Escrow Status</th>
                    <th className="py-3 px-4">Payout Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#5a1645] block">{tx.id}</span>
                        <span className="text-[10px] text-[#888] font-mono">{tx.deedNumber}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1f2428] block">{tx.propertyTitle}</span>
                        <span className="text-[10px] text-[#777]">{tx.enclave} · {tx.type.toUpperCase()}</span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#333]">{tx.clientName}</td>

                      <td className="py-3.5 px-4 font-bold text-[#1f2428]">
                        {formatCurrency(tx.transactionValueAED, currency)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#5a1645]">
                        {formatCurrency(tx.brokerageCommissionAED, currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-emerald-800">
                          {formatCurrency(tx.agentCommissionSplitAED, currency)}
                        </div>
                        <span className="text-[10px] text-[#888]">To: {tx.agentName}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                          {tx.escrowStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider ${
                          tx.commissionPaymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.commissionPaymentStatus === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.commissionPaymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={tx.commissionPaymentStatus}
                          onChange={(e) => handleUpdateCommissionStatus(tx.id, e.target.value as any)}
                          className="py-1 px-2 text-[10px] font-medium bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px] focus:outline-none"
                        >
                          <option value="pending">Mark Pending</option>
                          <option value="processing">Mark Processing</option>
                          <option value="paid">Mark Paid & Cleared</option>
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

      {/* 3. STAFF DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Certified Brokerage Staff & Executive Accounts
              </h2>
              <p className="text-xs text-[#75777a]">
                Active certified sovereign advisors, operations managers, and principal partners
              </p>
            </div>

            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-[#1f2428] text-[#c5a880] rounded-[2px] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#121517] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* Organizational Capacity Quota Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-[3px] border border-[#c5a880]/30 shadow-xs">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#666]">Sales Agent Capacity</span>
                <span className="font-mono font-bold text-[#142B3B]">
                  {staff.filter((s) => s.role === 'sales_agent').length} / 25
                </span>
              </div>
              <div className="w-full bg-[#f0ede6] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C5A46D] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (staff.filter((s) => s.role === 'sales_agent').length / 25) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#888] mt-1 block">Maximum 25 dedicated client consultants</span>
            </div>

            <div className="bg-white p-4 rounded-[3px] border border-[#c5a880]/30 shadow-xs">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#666]">Admin Accounts</span>
                <span className="font-mono font-bold text-[#142B3B]">
                  {staff.filter((s) => s.role === 'admin').length} / 2
                </span>
              </div>
              <div className="w-full bg-[#f0ede6] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#477A65] h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (staff.filter((s) => s.role === 'admin').length / 2) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#888] mt-1 block">Exactly 2 authorized operations managers</span>
            </div>

            <div className="bg-white p-4 rounded-[3px] border border-[#c5a880]/30 shadow-xs">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold uppercase tracking-wider text-[10px] text-[#666]">Super Admin Governance</span>
                <span className="font-mono font-bold text-[#142B3B]">1 / 1</span>
              </div>
              <div className="w-full bg-[#f0ede6] h-2 rounded-full overflow-hidden">
                <div className="bg-[#142B3B] h-full rounded-full w-full" />
              </div>
              <span className="text-[10px] text-[#888] mt-1 block">Executive managing partner office</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <div
                key={member.id}
                className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-[2px] object-cover border border-[#c5a880]/40"
                    />
                    <div>
                      <h4 className="font-editorial text-lg font-medium text-[#1f2428]">{member.name}</h4>
                      <p className="text-xs text-[#75777a]">{member.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1f2428] text-[#c5a880]">
                          {member.role.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#eee] text-[#444]">
                          {(member as any).employeeCode || (member.role === 'sales_agent' ? `AGT-00${member.id}` : `ADM-0${member.id}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs pt-3 border-t border-[#eee]">
                    <div className="flex justify-between">
                      <span className="text-[#666]">Department:</span>
                      <span className="text-[#333] font-medium">{(member as any).department || 'Luxury Real Estate'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Email:</span>
                      <span className="font-mono text-[#333] truncate max-w-[170px]">{member.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Phone:</span>
                      <span className="font-mono text-[#333]">{member.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">Status:</span>
                      <span className="font-bold text-emerald-700 capitalize">{member.status}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#eee] flex items-center justify-between text-xs">
                  <span className="text-[#666]">Base: {formatCurrency(member.baseSalaryAED, currency)}</span>
                  <button
                    onClick={() => {
                      setEditingStaff(member);
                      setNewBaseSalary(member.baseSalaryAED);
                      setNewCommissionRate(member.commissionRatePercent);
                    }}
                    className="text-[#142B3B] hover:underline font-semibold cursor-pointer"
                  >
                    Adjust Terms
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. COMPENSATION & SPLITS */}
      {activeTab === 'compensation' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Advisor Compensation & Split Structure
            </h2>
            <p className="text-xs text-[#75777a]">
              Manage base monthly retainers, commission split percentages, and year-to-date earnings
            </p>
          </div>

          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role Tier</th>
                    <th className="py-3 px-4">Base Monthly Retainer</th>
                    <th className="py-3 px-4">Commission Split Tier</th>
                    <th className="py-3 px-4">Closed Volume YTD</th>
                    <th className="py-3 px-4">Deals Closed</th>
                    <th className="py-3 px-4 text-right">Modify Terms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1f2428]">
                        <div>{s.name}</div>
                        <div className="text-[10px] text-[#888] font-normal">{s.title}</div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-[#5a1645]">
                        {s.role.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {formatCurrency(s.baseSalaryAED, currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.commissionRatePercent}% Split
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#1f2428]">
                        {formatCurrency(s.totalVolumeAED, currency)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{s.dealsClosedYTD} Deals</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingStaff(s);
                            setNewBaseSalary(s.baseSalaryAED);
                            setNewCommissionRate(s.commissionRatePercent);
                          }}
                          className="px-3 py-1 bg-[#1f2428] text-[#c5a880] rounded-[2px] text-[11px] font-semibold hover:bg-[#121517] transition-colors"
                        >
                          Edit Terms
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

      {/* 5. COMPLIANCE & TITLE DEEDS */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Sovereign KYC, AML Clearance & Title Deed Verification
              </h2>
              <p className="text-xs text-[#75777a]">
                Regulatory audit oversight complying with Central Bank of the UAE and Dubai Land Department standards
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-[2px]">
              AML Screening Engine: Active
            </span>
          </div>

          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Doc Ref</th>
                    <th className="py-3 px-4">Subject / Entity</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4">Auditor Notes</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {complianceDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#5a1645]">{doc.referenceNo}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#1f2428]">{doc.clientOrStaffName}</td>
                      <td className="py-3.5 px-4 text-[11px] text-[#666]">{doc.category}</td>
                      <td className="py-3.5 px-4 font-medium text-[#1f2428]">{doc.documentType}</td>
                      <td className="py-3.5 px-4 text-[#777]">{doc.submittedDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase ${
                          doc.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'pending_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#555] text-[11px] max-w-[220px]">{doc.notes}</td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={doc.status}
                          onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value as any)}
                          className="py-1 px-2 text-[10px] font-medium bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                        >
                          <option value="verified">Approve & Verify</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="flagged">Flag Compliance Risk</option>
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

      {/* 6. AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
                Tamper-Evident System Audit Trail
              </h2>
              <p className="text-xs text-[#75777a]">
                Chronological security log capturing all administrative actions, reassignments, and financial clearances
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[3px] border border-[#c5a880]/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action Event</th>
                    <th className="py-3 px-4">Target Detail</th>
                    <th className="py-3 px-4">IP Geolocation</th>
                    <th className="py-3 px-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#555]">{log.timestamp}</td>
                      <td className="py-3 px-4 font-semibold text-[#1f2428]">{log.actorName}</td>
                      <td className="py-3 px-4 text-[10px] uppercase font-bold text-[#888]">{log.actorRole}</td>
                      <td className="py-3 px-4 font-medium text-[#1f2428]">{log.action}</td>
                      <td className="py-3 px-4 text-[#555] max-w-[260px] truncate">{log.target}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#777]">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase ${
                          log.severity === 'info'
                            ? 'bg-blue-50 text-blue-800'
                            : log.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. SECURITY & ACCESS CONTROL */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              Role-Based Access Control (RBAC) Matrix & Security Monitoring
            </h2>
            <p className="text-xs text-[#75777a]">
              Strict permission isolation across Customer, Sales Agent, Admin, and Super Admin roles
            </p>
          </div>

          <div className="bg-white p-6 rounded-[3px] border border-[#c5a880]/30 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1f2428] text-[#c5a880] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Capability / Scope</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sales Agent</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee]">
                {[
                  { name: 'Public Search, Filter & Shortlist', c: true, a: true, adm: true, sa: true },
                  { name: 'Book Viewings & Submit Enquiries', c: true, a: false, adm: false, sa: false },
                  { name: 'View Assigned Client Mandates Only', c: false, a: true, adm: false, sa: false },
                  { name: 'Log Calls, WhatsApp & Video Meetings', c: false, a: true, adm: true, sa: true },
                  { name: 'Global Incoming Lead Intake & Reassignment', c: false, a: false, adm: true, sa: true },
                  { name: 'Agent Activity & Performance Oversight', c: false, a: false, adm: true, sa: true },
                  { name: 'Financial Transaction Ledger & Title Deeds', c: false, a: false, adm: false, sa: true },
                  { name: 'Employee Salary & Commission Tier Management', c: false, a: false, adm: false, sa: true },
                  { name: 'System Audit Logs & Security Configuration', c: false, a: false, adm: false, sa: true }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#faf9f7]">
                    <td className="py-3 px-4 font-medium text-[#1f2428]">{row.name}</td>
                    <td className="py-3 px-4">{row.c ? '✅ Allowed' : '—'}</td>
                    <td className="py-3 px-4">{row.a ? '✅ Allowed' : '—'}</td>
                    <td className="py-3 px-4">{row.adm ? '✅ Allowed' : '—'}</td>
                    <td className="py-3 px-4">{row.sa ? '👑 Full Access' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SYSTEM CONFIGURATION */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          <div>
            <h2 className="font-editorial text-2xl font-medium text-[#1f2428]">
              System Parameters & Brokerage Governance
            </h2>
            <p className="text-xs text-[#75777a]">
              Enterprise defaults prepared for FastAPI backend synchronization
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-[3px] border border-[#c5a880]/30 shadow-sm max-w-2xl space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                Default Settlement Currency
              </label>
              <select
                value={config.defaultCurrency}
                onChange={(e) => {
                  superAdminApi.updateConfig({ defaultCurrency: e.target.value }).then(setConfig);
                  showNotice('Default currency configuration saved.');
                }}
                className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
              >
                <option value="AED">AED — United Arab Emirates Dirham</option>
                <option value="USD">USD — United States Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CHF">CHF — Swiss Franc</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                Standard Gross Brokerage Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.brokerageCommissionStandardPercent}
                onChange={(e) => {
                  superAdminApi.updateConfig({ brokerageCommissionStandardPercent: Number(e.target.value) }).then(setConfig);
                }}
                className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[11px]">
                Lead Auto-Assignment Routing Policy
              </label>
              <select
                value={config.autoAssignAlgorithm}
                onChange={(e) => {
                  superAdminApi.updateConfig({ autoAssignAlgorithm: e.target.value as any }).then(setConfig);
                  showNotice('Lead assignment routing policy updated.');
                }}
                className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
              >
                <option value="Specialty & Enclave">Specialty & Enclave (Palm Jumeirah / Emirates Hills focus)</option>
                <option value="Round Robin">Round Robin (Even Distribution)</option>
                <option value="Workload Balance">Workload Balance (Minimum Active Leads)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#eee] text-[#666] text-[11px]">
              Ready for FastAPI integration: `PATCH /api/v1/superadmin/config`
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Compensation */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-[3px] border border-[#c5a880] p-6 shadow-2xl space-y-4">
            <h3 className="font-editorial text-xl font-medium text-[#1f2428]">
              Adjust Compensation for {editingStaff.name}
            </h3>
            <p className="text-xs text-[#75777a]">{editingStaff.title}</p>

            <form onSubmit={handleSaveCompensation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Base Monthly Retainer (AED)
                </label>
                <input
                  type="number"
                  value={newBaseSalary}
                  onChange={(e) => setNewBaseSalary(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Commission Split Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-[#eee] text-[#444] rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-[#1f2428] text-[#c5a880] rounded-[2px]"
                >
                  Save Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Staff Member */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-[3px] border border-[#c5a880] p-6 shadow-2xl space-y-4">
            <h3 className="font-editorial text-xl font-medium text-[#1f2428]">
              Onboard Certified Staff Member
            </h3>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Yasmin Al-Mulla"
                  className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="yasmin@lykarealty.ae"
                  className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Role Selection
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                >
                  <option value="sales_agent">Sales Agent (Advisory Desk)</option>
                  <option value="admin">Admin (Operations Manager)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Employee Code & Department
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="e.g. AGT-006"
                    className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                  />
                  <input
                    type="text"
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    placeholder="Prime Residential Sales"
                    className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1f2428] mb-1 uppercase tracking-wider text-[10px]">
                  Official Title
                </label>
                <input
                  type="text"
                  value={staffTitle}
                  onChange={(e) => setStaffTitle(e.target.value)}
                  placeholder="Senior Sovereign Advisor — Penthouse Collection"
                  className="w-full p-2 bg-[#faf9f7] border border-[#c5a880]/30 rounded-[2px]"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-[#eee] text-[#444] rounded-[2px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-[#1f2428] text-[#c5a880] rounded-[2px]"
                >
                  Provision Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
