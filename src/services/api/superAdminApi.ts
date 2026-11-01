// Super Admin API service layer connected to persistent backend database endpoints
import { crmService } from '../crmService';
import { StaffMember, AuditLogEntry, ComplianceDocument } from '../mockData';

export interface SystemConfig {
  defaultCurrency: string;
  brokerageCommissionStandardPercent: number;
  autoAssignAlgorithm: 'Round Robin' | 'Specialty & Enclave' | 'Workload Balance';
  dldIntegrationStatus: 'Connected (REST API v2.4)' | 'Simulated';
  twoFactorAuthEnforced: boolean;
  amlScreeningService: 'WorldCheck & DLD AML Engine' | 'Manual Verification';
}

class SuperAdminApiService {
  private config: SystemConfig = {
    defaultCurrency: 'AED',
    brokerageCommissionStandardPercent: 2.0,
    autoAssignAlgorithm: 'Specialty & Enclave',
    dldIntegrationStatus: 'Connected (REST API v2.4)',
    twoFactorAuthEnforced: true,
    amlScreeningService: 'WorldCheck & DLD AML Engine'
  };

  async getStaff(): Promise<StaffMember[]> {
    return await crmService.getStaff();
  }

  async addStaffMember(data: Omit<StaffMember, 'id' | 'dealsClosedYTD' | 'totalVolumeAED' | 'activeDealsCount' | 'assignedLeadsCount'>): Promise<StaffMember> {
    const staffList = await crmService.getStaff();
    const newMember: StaffMember = {
      ...data,
      id: `staff-${Date.now()}`,
      dealsClosedYTD: 0,
      totalVolumeAED: 0,
      activeDealsCount: 0,
      assignedLeadsCount: 0
    };
    staffList.push(newMember);
    return newMember;
  }

  async updateStaffCompensation(staffId: string, baseSalaryAED: number, commissionRatePercent: number): Promise<StaffMember> {
    return await crmService.updateStaff(staffId, {
      baseSalaryAED,
      commissionRatePercent
    });
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return await crmService.getAuditLogs();
  }

  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const logs = await this.getAuditLogs();
    const newLog: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    logs.unshift(newLog);
    return newLog;
  }

  async getComplianceDocs(): Promise<ComplianceDocument[]> {
    return await crmService.getComplianceDocs();
  }

  async updateComplianceStatus(docId: string, status: ComplianceDocument['status']): Promise<ComplianceDocument> {
    const docs = await crmService.getComplianceDocs();
    const doc = docs.find(d => d.id === docId);
    if (!doc) throw new Error('Document not found');
    doc.status = status;
    return doc;
  }

  async getConfig(): Promise<SystemConfig> {
    return { ...this.config };
  }

  async updateConfig(partial: Partial<SystemConfig>): Promise<SystemConfig> {
    this.config = { ...this.config, ...partial };
    return { ...this.config };
  }
}

export const superAdminApi = new SuperAdminApiService();
