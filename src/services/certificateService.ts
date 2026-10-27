import { CertificateData } from '../types';

export interface CentralSyncResponse {
  success: boolean;
  certificates?: CertificateData[];
  certificate?: CertificateData;
  count?: number;
  timestamp?: string;
  error?: string;
}

export const certificateService = {
  // Fetch all certificates from central server
  async getAll(): Promise<CertificateData[] | null> {
    try {
      const res = await fetch('/api/certificates');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: CentralSyncResponse = await res.json();
      if (data.success && Array.isArray(data.certificates)) {
        return data.certificates;
      }
    } catch (err) {
      console.warn('Central server unavailable, using local state:', err);
    }
    return null;
  },

  // Add a new recipient to central server
  async create(cert: CertificateData): Promise<boolean> {
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to sync new certificate to central server:', err);
      return false;
    }
  },

  // Update a certificate on central server
  async update(cert: CertificateData): Promise<boolean> {
    try {
      const res = await fetch(`/api/certificates/${cert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to sync update to central server:', err);
      return false;
    }
  },

  // Delete a certificate on central server
  async delete(certId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/certificates/${certId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to delete on central server:', err);
      return false;
    }
  },

  // Bulk update date for all certificates
  async bulkUpdateDate(issuedDateText: string, issuedDateIso?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/certificates/bulk-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuedDateText, issuedDateIso }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to bulk update date on central server:', err);
      return false;
    }
  },

  // Bulk update signature style
  async bulkUpdateSignatureStyle(signatureStyle: 'digital' | 'line-only' | 'both'): Promise<boolean> {
    try {
      const res = await fetch('/api/certificates/bulk-signature-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureStyle }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update signature style on central server:', err);
      return false;
    }
  },

  // Reset to default 12 certificates
  async reset(): Promise<CertificateData[] | null> {
    try {
      const res = await fetch('/api/certificates/reset', {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data: CentralSyncResponse = await res.json();
      if (data.success && Array.isArray(data.certificates)) {
        return data.certificates;
      }
    } catch (err) {
      console.error('Failed to reset central server:', err);
    }
    return null;
  },
};
