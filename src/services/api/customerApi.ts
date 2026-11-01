// Customer API service layer connected to persistent backend database endpoints
import { crmService } from '../crmService';
import { CustomerEnquiry, ViewingAppointment } from '../mockData';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  investorTier: 'Sovereign / Family Office' | 'Ultra High Net Worth (UHNW)' | 'Institutional Private Fund';
  mandateEnclaves: string[];
  kycStatus: 'Verified' | 'Pending Review' | 'Not Submitted';
  preferredContact: 'WhatsApp Encrypted' | 'Direct Private Call' | 'In-Person Briefing';
}

class CustomerApiService {
  private profile: CustomerProfile = {
    id: 'cust-vance-01',
    name: 'Lady Alexandra Vance',
    email: 'alexandra.vance@vanceholdings.ch',
    phone: '+41 79 555 0192',
    nationality: 'Swiss / British',
    investorTier: 'Sovereign / Family Office',
    mandateEnclaves: ['Palm Jumeirah', 'Jumeirah Bay Island', 'Emirates Hills'],
    kycStatus: 'Verified',
    preferredContact: 'WhatsApp Encrypted'
  };

  async getProfile(): Promise<CustomerProfile> {
    return { ...this.profile };
  }

  async updateProfile(updates: Partial<CustomerProfile>): Promise<CustomerProfile> {
    this.profile = { ...this.profile, ...updates };
    return { ...this.profile };
  }

  async getEnquiries(email?: string): Promise<CustomerEnquiry[]> {
    return await crmService.getEnquiries(email || this.profile.email);
  }

  async submitEnquiry(enquiry: Omit<CustomerEnquiry, 'id' | 'date' | 'status'>): Promise<CustomerEnquiry> {
    const created = await crmService.createEnquiry({
      ...enquiry,
      status: 'Received'
    });
    return created;
  }

  async getViewings(): Promise<ViewingAppointment[]> {
    return await crmService.getViewings();
  }

  async requestViewing(data: {
    propertyId: string;
    propertyTitle: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<ViewingAppointment> {
    const newViewing = await crmService.createViewing({
      leadId: 'lead-101',
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle,
      agentId: 'agent-01',
      agentName: 'Rashid Al-Falasi',
      clientName: this.profile.name,
      clientPhone: this.profile.phone,
      date: data.date,
      time: data.time,
      status: 'requested',
      notes: data.notes
    });
    return newViewing;
  }
}

export const customerApi = new CustomerApiService();
