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
  // Fetch all certificates from central server with strict anti-cache
  async getAll(): Promise<CertificateData[] | null> {
    try {
      // Timestamp query param and no-store prevents iOS/Android/Chrome browser caching
      const res = await fetch(`/api/certificates?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
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

  // Subscribe to real-time updates from server using SSE
  // When ANY other device adds, edits, or deletes a certificate, this triggers instantly!
  subscribeToUpdates(
    onUpdate: (certs: CertificateData[], actionType: string) => void,
    onStatusChange?: (isOnline: boolean) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    let isClosedManually = false;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (isClosedManually) return;

      try {
        eventSource = new EventSource(`/api/certificates/stream?_t=${Date.now()}`);

        eventSource.onopen = () => {
          onStatusChange?.(true);
        };

        eventSource.addEventListener('certificate_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && Array.isArray(data.certificates)) {
              onUpdate(data.certificates, data.type || 'UPDATE');
              onStatusChange?.(true);
            }
          } catch (err) {
            console.error('Failed to parse SSE certificate update:', err);
          }
        });

        eventSource.onerror = (err) => {
          console.warn('SSE stream error/reconnecting...', err);
          onStatusChange?.(false);
          eventSource?.close();
          eventSource = null;

          // Attempt reconnect after 3 seconds
          if (!isClosedManually) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        console.error('Failed to initiate SSE connection:', err);
        onStatusChange?.(false);
        if (!isClosedManually) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connect, 4000);
        }
      }
    };

    connect();

    return () => {
      isClosedManually = true;
      clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },

  // Add a new recipient to central server
  async create(cert: CertificateData): Promise<boolean> {
    try {
      const res = await fetch(`/api/certificates?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
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
      const res = await fetch(`/api/certificates/${cert.id}?_t=${Date.now()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
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
      const res = await fetch(`/api/certificates/${certId}?_t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        },
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
      const res = await fetch(`/api/certificates/bulk-date?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
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
      const res = await fetch(`/api/certificates/bulk-signature-style?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
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
      const res = await fetch(`/api/certificates/reset?_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache',
        },
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
