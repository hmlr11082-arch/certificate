import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CERTIFICATES } from './src/data/initialCertificates.ts';
import { CertificateData } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'certificates.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache for fast synchronization
let inMemoryCertificates: CertificateData[] = [];

// Helper to read certificates from disk / memory
function readCertificates(): CertificateData[] {
  if (inMemoryCertificates.length > 0) {
    return inMemoryCertificates;
  }
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryCertificates = parsed;
        return inMemoryCertificates;
      }
    }
  } catch (err) {
    console.error('Error reading certificates from disk:', err);
  }
  // Fallback to initial certificates and seed disk
  inMemoryCertificates = [...INITIAL_CERTIFICATES];
  writeCertificates(inMemoryCertificates, false);
  return inMemoryCertificates;
}

// Active SSE client connections for real-time push to all devices
const sseClients = new Set<express.Response>();

function broadcastUpdate(certs: CertificateData[], actionType: string = 'UPDATE') {
  inMemoryCertificates = certs;
  const payload = JSON.stringify({
    type: actionType,
    certificates: certs,
    count: certs.length,
    timestamp: new Date().toISOString(),
  });

  for (const client of sseClients) {
    try {
      client.write(`event: certificate_update\ndata: ${payload}\n\n`);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Helper to write certificates to disk and broadcast to all connected devices
function writeCertificates(certs: CertificateData[], shouldBroadcast: boolean = true): void {
  inMemoryCertificates = certs;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(certs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing certificates to disk:', err);
  }
  if (shouldBroadcast) {
    broadcastUpdate(certs);
  }
}

// Preload certificates on startup
readCertificates();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // =================== ANTI-CACHE & CORS MIDDLEWARE ===================
  // Ensure browsers (mobile, tablet, desktop) and proxies NEVER cache API responses
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // =================== REAL-TIME SSE STREAM ===================
  // All devices connect here to receive instant updates when names are added/deleted/edited
  app.get('/api/certificates/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Cloud Run proxies
    res.flushHeaders?.();

    // Send initial state immediately upon connection
    const current = readCertificates();
    const initialPayload = JSON.stringify({
      type: 'INIT',
      certificates: current,
      count: current.length,
      timestamp: new Date().toISOString(),
    });
    res.write(`event: certificate_update\ndata: ${initialPayload}\n\n`);

    sseClients.add(res);

    // Heartbeat every 15s to keep connection alive through Cloud Run / mobile networks
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeatTimer);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      sseClients.delete(res);
    });
  });

  // =================== CENTRAL STORAGE REST API ===================

  // 1. Get all certificates from central store
  app.get('/api/certificates', (req, res) => {
    try {
      const certificates = readCertificates();
      res.json({
        success: true,
        certificates,
        count: certificates.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to read central database' });
    }
  });

  // 2. Add a new recipient certificate (instantly broadcasts to all devices)
  app.post('/api/certificates', (req, res) => {
    try {
      const newCert: CertificateData = req.body;
      if (!newCert || !newCert.recipientName) {
        return res.status(400).json({ success: false, error: 'Recipient name is required' });
      }

      const certificates = readCertificates();
      // Ensure unique ID
      const certId = newCert.id || `cert-${Date.now()}`;
      const certWithId = { ...newCert, id: certId };
      const updated = [...certificates, certWithId];
      
      writeCertificates(updated, true); // Writes to disk and broadcasts to all devices

      res.status(201).json({
        success: true,
        certificate: certWithId,
        count: updated.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to add certificate' });
    }
  });

  // 3. Update an existing certificate (instantly broadcasts to all devices)
  app.put('/api/certificates/:id', (req, res) => {
    try {
      const certId = req.params.id;
      const updatedCert: CertificateData = req.body;
      const certificates = readCertificates();

      const index = certificates.findIndex((c) => c.id === certId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Certificate not found' });
      }

      const updatedList = [...certificates];
      updatedList[index] = { ...updatedList[index], ...updatedCert, id: certId };
      writeCertificates(updatedList, true);

      res.json({
        success: true,
        certificate: updatedList[index],
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update certificate' });
    }
  });

  // 4. Delete a certificate and re-sequence order numbers (instantly broadcasts to all devices)
  app.delete('/api/certificates/:id', (req, res) => {
    try {
      const certId = req.params.id;
      const certificates = readCertificates();

      if (certificates.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete last certificate' });
      }

      const filtered = certificates.filter((c) => c.id !== certId);
      const reordered = filtered.map((c, idx) => ({
        ...c,
        orderNumber: idx + 1,
      }));

      writeCertificates(reordered, true); // Writes to disk & broadcasts to all devices!

      res.json({
        success: true,
        certificates: reordered,
        count: reordered.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to delete certificate' });
    }
  });

  // 5. Bulk apply date to all certificates
  app.post('/api/certificates/bulk-date', (req, res) => {
    try {
      const { issuedDateText, issuedDateIso } = req.body;
      if (!issuedDateText) {
        return res.status(400).json({ success: false, error: 'issuedDateText is required' });
      }

      const certificates = readCertificates();
      const updated = certificates.map((c) => ({
        ...c,
        issuedDateText,
        issuedDateIso: issuedDateIso || c.issuedDateIso,
      }));

      writeCertificates(updated);

      res.json({
        success: true,
        certificates: updated,
        count: updated.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update date in bulk' });
    }
  });

  // 6. Bulk update signature style (e.g. blank for pen signing vs simulated)
  app.post('/api/certificates/bulk-signature-style', (req, res) => {
    try {
      const { signatureStyle } = req.body;
      const certificates = readCertificates();
      const updated = certificates.map((c) => ({
        ...c,
        signatureStyle,
      }));

      writeCertificates(updated);

      res.json({
        success: true,
        certificates: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update signature style' });
    }
  });

  // 7. Reset all certificates to original 12 hospital awards
  app.post('/api/certificates/reset', (req, res) => {
    try {
      writeCertificates(INITIAL_CERTIFICATES);
      res.json({
        success: true,
        certificates: INITIAL_CERTIFICATES,
        count: INITIAL_CERTIFICATES.length,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to reset central database' });
    }
  });

  // =================== VITE SPA SERVING ===================

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Central Certificates Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
