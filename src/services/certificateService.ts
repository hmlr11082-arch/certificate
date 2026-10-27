import { CertificateData } from '../types';
import { db, testFirestoreConnection } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { INITIAL_CERTIFICATES } from '../data/initialCertificates';

export interface CentralSyncResponse {
  success: boolean;
  certificates?: CertificateData[];
  certificate?: CertificateData;
  count?: number;
  timestamp?: string;
  error?: string;
}

// Helper to remove any undefined properties so Firestore doesn't reject writes
function cleanForFirestore(cert: CertificateData): Record<string, any> {
  const copy: Record<string, any> = { ...cert };
  Object.keys(copy).forEach((key) => {
    if (copy[key] === undefined) {
      delete copy[key];
    }
  });
  return copy;
}

export const certificateService = {
  // Test cloud connection
  async checkCloudConnection(): Promise<boolean> {
    return await testFirestoreConnection();
  },

  // Fetch all certificates directly from Google Cloud Firestore (with fallback)
  async getAll(): Promise<CertificateData[] | null> {
    try {
      const colRef = collection(db, 'certificates');
      const q = query(colRef, orderBy('orderNumber', 'asc'));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const certs: CertificateData[] = [];
        snapshot.forEach((docSnap) => {
          certs.push(docSnap.data() as CertificateData);
        });
        return certs;
      }

      // If cloud database is empty, seed initial 12 certificates to Google Cloud Firestore
      await this.seedInitial();
      return [...INITIAL_CERTIFICATES];
    } catch (err) {
      console.warn('Google Cloud Firestore fetch error, trying backend server:', err);
    }

    // Fallback to local server API
    try {
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
      console.warn('Backend server fallback error:', err);
    }

    return null;
  },

  // Seed default 12 certificates into Google Cloud Firestore
  async seedInitial(): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const cert of INITIAL_CERTIFICATES) {
        const docRef = doc(db, 'certificates', cert.id);
        batch.set(docRef, cleanForFirestore(cert), { merge: true });
      }
      await batch.commit();
      console.log('Successfully seeded 12 certificates to Google Cloud Firestore');
    } catch (err) {
      console.error('Failed to seed initial certificates to Firestore:', err);
    }
  },

  // Subscribe to real-time updates from Google Cloud Firestore across all devices
  // Uses Firestore onSnapshot for instantaneous cross-device syncing
  subscribeToUpdates(
    onUpdate: (certs: CertificateData[], actionType: string) => void,
    onStatusChange?: (isOnline: boolean, source?: string) => void
  ): () => void {
    let unsubscribeFirestore: (() => void) | null = null;
    let fallbackUnsubscribe: (() => void) | null = null;
    let hasReceivedFirestoreData = false;

    try {
      const colRef = collection(db, 'certificates');
      const q = query(colRef, orderBy('orderNumber', 'asc'));

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          hasReceivedFirestoreData = true;
          onStatusChange?.(true, 'Google Cloud (Firestore)');

          if (snapshot.empty) {
            // Auto seed if empty
            this.seedInitial().then(() => {
              onUpdate([...INITIAL_CERTIFICATES], 'INITIAL_SEED');
            });
            return;
          }

          const certs: CertificateData[] = [];
          snapshot.forEach((docSnap) => {
            certs.push(docSnap.data() as CertificateData);
          });

          // Sort by orderNumber
          certs.sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0));
          onUpdate(certs, 'CLOUD_SYNC');
        },
        (error) => {
          console.warn('Google Cloud Firestore onSnapshot listener error:', error);
          onStatusChange?.(false, 'Offline / Reconnecting');

          // Fallback to Server-Sent Events (SSE) if Firestore has connection difficulty
          if (!hasReceivedFirestoreData && !fallbackUnsubscribe) {
            fallbackUnsubscribe = this.subscribeWithSSE(onUpdate, onStatusChange);
          }
        }
      );
    } catch (err) {
      console.error('Failed to set up Google Cloud Firestore listener:', err);
      fallbackUnsubscribe = this.subscribeWithSSE(onUpdate, onStatusChange);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (fallbackUnsubscribe) fallbackUnsubscribe();
    };
  },

  // Fallback SSE subscriber
  subscribeWithSSE(
    onUpdate: (certs: CertificateData[], actionType: string) => void,
    onStatusChange?: (isOnline: boolean, source?: string) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    let isClosedManually = false;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (isClosedManually) return;
      try {
        eventSource = new EventSource(`/api/certificates/stream?_t=${Date.now()}`);

        eventSource.onopen = () => {
          onStatusChange?.(true, 'Local Central Server');
        };

        eventSource.addEventListener('certificate_update', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && Array.isArray(data.certificates)) {
              onUpdate(data.certificates, data.type || 'UPDATE');
              onStatusChange?.(true, 'Local Central Server');
            }
          } catch (err) {
            console.error('Failed to parse SSE certificate update:', err);
          }
        });

        eventSource.onerror = (err) => {
          onStatusChange?.(false, 'Offline / Reconnecting');
          eventSource?.close();
          eventSource = null;
          if (!isClosedManually) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (err) {
        onStatusChange?.(false, 'Offline');
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

  // Add a new certificate to Google Cloud Firestore
  async create(cert: CertificateData): Promise<boolean> {
    try {
      const docRef = doc(db, 'certificates', cert.id);
      await setDoc(docRef, cleanForFirestore(cert));
      // Also notify local server
      fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      }).catch(() => {});
      return true;
    } catch (err) {
      console.error('Google Cloud Firestore create error, saving to server:', err);
      try {
        const res = await fetch(`/api/certificates?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
          body: JSON.stringify(cert),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Update an existing certificate on Google Cloud Firestore
  async update(cert: CertificateData): Promise<boolean> {
    try {
      const docRef = doc(db, 'certificates', cert.id);
      await setDoc(docRef, cleanForFirestore(cert), { merge: true });
      // Also notify local server
      fetch(`/api/certificates/${cert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      }).catch(() => {});
      return true;
    } catch (err) {
      console.error('Google Cloud Firestore update error, saving to server:', err);
      try {
        const res = await fetch(`/api/certificates/${cert.id}?_t=${Date.now()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
          body: JSON.stringify(cert),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Delete a certificate from Google Cloud Firestore
  async delete(certId: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'certificates', certId);
      await deleteDoc(docRef);
      // Also notify local server
      fetch(`/api/certificates/${certId}`, {
        method: 'DELETE',
      }).catch(() => {});
      return true;
    } catch (err) {
      console.error('Google Cloud Firestore delete error, deleting on server:', err);
      try {
        const res = await fetch(`/api/certificates/${certId}?_t=${Date.now()}`, {
          method: 'DELETE',
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Bulk update date across all certificates on Google Cloud Firestore
  async bulkUpdateDate(issuedDateText: string, issuedDateIso?: string): Promise<boolean> {
    try {
      const colRef = collection(db, 'certificates');
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);

      snapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          issuedDateText,
          ...(issuedDateIso ? { issuedDateIso } : {}),
        });
      });

      await batch.commit();

      // Also call server API
      fetch('/api/certificates/bulk-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuedDateText, issuedDateIso }),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error('Google Cloud Firestore bulkUpdateDate error, calling server:', err);
      try {
        const res = await fetch(`/api/certificates/bulk-date?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issuedDateText, issuedDateIso }),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Bulk update signature style on Google Cloud Firestore
  async bulkUpdateSignatureStyle(
    signatureStyle: 'digital' | 'line-only' | 'both'
  ): Promise<boolean> {
    try {
      const colRef = collection(db, 'certificates');
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);

      snapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, { signatureStyle });
      });

      await batch.commit();

      fetch('/api/certificates/bulk-signature-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureStyle }),
      }).catch(() => {});

      return true;
    } catch (err) {
      console.error('Google Cloud Firestore bulkUpdateSignatureStyle error:', err);
      try {
        const res = await fetch(`/api/certificates/bulk-signature-style?_t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signatureStyle }),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Reset to default 12 certificates on Google Cloud Firestore
  async reset(): Promise<CertificateData[] | null> {
    try {
      const colRef = collection(db, 'certificates');
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);

      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      for (const cert of INITIAL_CERTIFICATES) {
        const docRef = doc(db, 'certificates', cert.id);
        batch.set(docRef, cleanForFirestore(cert));
      }

      await batch.commit();

      fetch('/api/certificates/reset', { method: 'POST' }).catch(() => {});
      return [...INITIAL_CERTIFICATES];
    } catch (err) {
      console.error('Google Cloud Firestore reset error, resetting via server:', err);
      try {
        const res = await fetch(`/api/certificates/reset?_t=${Date.now()}`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data: CentralSyncResponse = await res.json();
        if (data.success && Array.isArray(data.certificates)) {
          return data.certificates;
        }
      } catch (e) {
        console.error('Server reset error:', e);
      }
    }
    return null;
  },
};
