import { Router, Request, Response } from 'express';

const router = Router();

// Map of qrCode -> SSE Response object(s)
const citizenConnections = new Map<string, Set<Response>>();

// Helper: push a JSON event to all clients listening for a given qrCode
export function notifyCitizen(
  qrCode: string,
  payload: {
    type: 'COLLECTION_LOGGED';
    transaction: {
      wasteType: string;
      weightKg: number;
      pointsAwarded: number;
      createdAt: string;
    };
    newPoints: number;
    collectorName: string;
    citizenName: string;
  }
) {
  const cleanQr = String(qrCode).trim();
  const connections = citizenConnections.get(cleanQr);
  if (!connections || connections.size === 0) return;

  const data = JSON.stringify(payload);
  connections.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // Connection already closed
    }
  });
}

export function notifyCitizenDispatch(
  qrCode: string,
  payload: {
    type: 'TRUCK_DISPATCHED';
    destination: { lat: number; lng: number };
    startLocation: { lat: number; lng: number };
  }
) {
  const cleanQr = String(qrCode).trim();
  const connections = citizenConnections.get(cleanQr);
  if (!connections || connections.size === 0) return;

  const data = JSON.stringify(payload);
  connections.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch {
      // Connection already closed
    }
  });
}

// GET /api/events/citizen/:qrCode
// Citizen subscribes to real-time collection updates via SSE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/citizen/:qrCode', (req: Request<any>, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const qrCode: string = String(req.params['qrCode']).trim();

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Heartbeat every 25s to keep connection alive
  res.write(': connected\n\n');
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  // Register connection
  if (!citizenConnections.has(qrCode)) {
    citizenConnections.set(qrCode, new Set<Response>());
  }
  (citizenConnections.get(qrCode) as Set<Response>).add(res);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    const set = citizenConnections.get(qrCode);
    if (set) {
      set.delete(res);
      if (set.size === 0) citizenConnections.delete(qrCode);
    }
  });
});

export default router;
