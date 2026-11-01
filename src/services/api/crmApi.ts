// Frontend API service layer backed by backend REST database endpoints (/api/crm/*)
import { crmService } from '../crmService';
import {
  Lead,
  ActivityRecord,
  ViewingAppointment,
  DealTransaction,
  StaffMember
} from '../mockData';

class CrmApiService {
  // LEADS
  async getLeads(agentId?: string): Promise<Lead[]> {
    return await crmService.getLeads(agentId);
  }

  async getLeadById(leadId: string): Promise<Lead | undefined> {
    const leads = await crmService.getLeads();
    return leads.find(l => l.id === leadId);
  }

  async updateLeadStatus(leadId: string, status: Lead['status']): Promise<Lead> {
    return await crmService.updateLead(leadId, { status });
  }

  async updateLeadTemperature(leadId: string, temp: Lead['leadTemperature']): Promise<Lead> {
    return await crmService.updateLead(leadId, { leadTemperature: temp });
  }

  async reassignLead(leadId: string, newAgentId: string): Promise<Lead> {
    const staff = await crmService.getStaff();
    const agent = staff.find(s => s.id === newAgentId);
    if (!agent) throw new Error('Agent not found');
    return await crmService.updateLead(leadId, {
      assignedAgentId: agent.id,
      assignedAgentName: agent.name
    });
  }

  // ACTIVITIES (Calls, WhatsApp, Meetings)
  async getActivities(leadId?: string, agentId?: string): Promise<ActivityRecord[]> {
    return await crmService.getActivities(leadId, agentId);
  }

  async logActivity(data: Omit<ActivityRecord, 'id' | 'timestamp'>): Promise<ActivityRecord> {
    return await crmService.logActivity(data);
  }

  // VIEWINGS
  async getViewings(agentId?: string): Promise<ViewingAppointment[]> {
    return await crmService.getViewings(agentId);
  }

  async updateViewingStatus(viewingId: string, status: ViewingAppointment['status']): Promise<ViewingAppointment> {
    return await crmService.updateViewing(viewingId, { status });
  }

  // TRANSACTIONS
  async getTransactions(): Promise<DealTransaction[]> {
    return await crmService.getTransactions();
  }

  async updateCommissionStatus(txId: string, status: DealTransaction['commissionPaymentStatus']): Promise<DealTransaction> {
    const txs = await crmService.getTransactions();
    const tx = txs.find(t => t.id === txId);
    if (!tx) throw new Error('Transaction not found');
    tx.commissionPaymentStatus = status;
    return tx;
  }

  // STAFF
  async getStaff(role?: StaffMember['role']): Promise<StaffMember[]> {
    const staff = await crmService.getStaff();
    if (role) return staff.filter(s => s.role === role);
    return staff;
  }
}

export const crmApi = new CrmApiService();
