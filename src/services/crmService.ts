// High-fidelity CRM API Service communicating with the persistent backend database
import { Lead, ActivityRecord, ViewingAppointment, DealTransaction, StaffMember, AuditLogEntry, ComplianceDocument, CustomerEnquiry } from './mockData';

const BASE_URL = '/api/crm';

function getAuthHeaders(): Record<string, string> {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('lyka_session_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const crmService = {
  // Leads
  async getLeads(agentId?: string): Promise<Lead[]> {
    try {
      const url = agentId ? `${BASE_URL}/leads?agentId=${encodeURIComponent(agentId)}` : `${BASE_URL}/leads`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[crmService] Error fetching leads, falling back to mockData:', err);
      const { MOCK_LEADS } = await import('./mockData');
      return agentId ? MOCK_LEADS.filter((l) => l.assignedAgentId === agentId) : MOCK_LEADS;
    }
  },

  async createLead(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(lead)
    });
    if (!res.ok) throw new Error(`Failed to create lead: HTTP ${res.status}`);
    return await res.json();
  },

  async updateLead(id: string, updates: Partial<Lead>, actorName?: string): Promise<Lead> {
    const res = await fetch(`${BASE_URL}/leads/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...updates, actorName })
    });
    if (!res.ok) throw new Error(`Failed to update lead: HTTP ${res.status}`);
    return await res.json();
  },

  // Activities (Calls, WhatsApp, Meetings)
  async getActivities(leadId?: string, agentId?: string): Promise<ActivityRecord[]> {
    try {
      const params = new URLSearchParams();
      if (leadId) params.append('leadId', leadId);
      if (agentId) params.append('agentId', agentId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${BASE_URL}/activities${query}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_ACTIVITIES } = await import('./mockData');
      let acts = MOCK_ACTIVITIES;
      if (leadId) acts = acts.filter((a) => a.leadId === leadId);
      if (agentId) acts = acts.filter((a) => a.agentId === agentId);
      return acts;
    }
  },

  async logActivity(activity: Omit<ActivityRecord, 'id' | 'timestamp'>): Promise<ActivityRecord> {
    const res = await fetch(`${BASE_URL}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activity)
    });
    if (!res.ok) throw new Error(`Failed to log activity: HTTP ${res.status}`);
    return await res.json();
  },

  // Viewings
  async getViewings(agentId?: string): Promise<ViewingAppointment[]> {
    try {
      const url = agentId ? `${BASE_URL}/viewings?agentId=${encodeURIComponent(agentId)}` : `${BASE_URL}/viewings`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_VIEWINGS } = await import('./mockData');
      return agentId ? MOCK_VIEWINGS.filter((v) => v.agentId === agentId) : MOCK_VIEWINGS;
    }
  },

  async createViewing(viewing: Omit<ViewingAppointment, 'id'>): Promise<ViewingAppointment> {
    const res = await fetch(`${BASE_URL}/viewings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(viewing)
    });
    if (!res.ok) throw new Error(`Failed to schedule viewing: HTTP ${res.status}`);
    return await res.json();
  },

  async updateViewing(id: string, updates: Partial<ViewingAppointment>): Promise<ViewingAppointment> {
    const res = await fetch(`${BASE_URL}/viewings/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Failed to update viewing: HTTP ${res.status}`);
    return await res.json();
  },

  // Transactions
  async getTransactions(): Promise<DealTransaction[]> {
    try {
      const res = await fetch(`${BASE_URL}/transactions`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_TRANSACTIONS } = await import('./mockData');
      return MOCK_TRANSACTIONS;
    }
  },

  // Staff
  async getStaff(): Promise<StaffMember[]> {
    try {
      const res = await fetch(`${BASE_URL}/staff`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_STAFF } = await import('./mockData');
      return MOCK_STAFF;
    }
  },

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const res = await fetch(`${BASE_URL}/staff/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Failed to update staff: HTTP ${res.status}`);
    return await res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const res = await fetch(`${BASE_URL}/audit-logs`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_AUDIT_LOGS } = await import('./mockData');
      return MOCK_AUDIT_LOGS;
    }
  },

  // Compliance
  async getComplianceDocs(): Promise<ComplianceDocument[]> {
    try {
      const res = await fetch(`${BASE_URL}/compliance`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_COMPLIANCE_DOCS } = await import('./mockData');
      return MOCK_COMPLIANCE_DOCS;
    }
  },

  // Customer Enquiries
  async getEnquiries(email?: string): Promise<CustomerEnquiry[]> {
    try {
      const url = email ? `${BASE_URL}/enquiries?email=${encodeURIComponent(email)}` : `${BASE_URL}/enquiries`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const { MOCK_CUSTOMER_ENQUIRIES } = await import('./mockData');
      return email ? MOCK_CUSTOMER_ENQUIRIES.filter((e) => e.email.toLowerCase() === email.toLowerCase()) : MOCK_CUSTOMER_ENQUIRIES;
    }
  },

  async createEnquiry(enquiry: Omit<CustomerEnquiry, 'id' | 'date'>): Promise<CustomerEnquiry> {
    const res = await fetch(`${BASE_URL}/enquiries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(enquiry)
    });
    if (!res.ok) throw new Error(`Failed to submit enquiry: HTTP ${res.status}`);
    return await res.json();
  },

  // Direct Lead creation from AI Voice Assistant
  async createVoiceLead(data: {
    clientName: string;
    phone: string;
    email: string;
    notes: string;
    propertyTitle?: string;
    budget?: { min: number; max: number };
  }): Promise<Lead> {
    const res = await fetch(`${BASE_URL}/assistant/lead`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create voice lead: HTTP ${res.status}`);
    return await res.json();
  }
};
