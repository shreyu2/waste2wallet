import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { WasteTransaction } from '../models/WasteTransaction';
import { notifyCitizen } from './events';

const router = Router();

function isValidCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isValidAccuracy(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Scan waste QR and log transaction
router.post('/scan-waste', authenticateToken, requireRole('COLLECTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode, wasteType, weightKg } = req.body;
    const cleanQr = String(qrCode || '').trim();

    if (!cleanQr || !wasteType || typeof weightKg !== 'number' || weightKg <= 0) {
      res.status(400).json({ message: 'Valid qrCode, wasteType, and positive weightKg are required.' });
      return;
    }

    const validTypes = ['WET', 'DRY', 'PLASTIC', 'MIXED'];
    if (!validTypes.includes(wasteType)) {
      res.status(400).json({ message: 'Invalid wasteType. Must be WET, DRY, PLASTIC, or MIXED.' });
      return;
    }

    const citizen = await User.findOne({ qrCode: cleanQr, role: 'CITIZEN' });
    if (!citizen) {
      res.status(404).json({ message: 'Invalid QR Code. Citizen not found.' });
      return;
    }

    const collector = await User.findById(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: 'Collector not found.' });
      return;
    }

    const pointsMultiplier: Record<string, number> = {
      'WET': 10,
      'DRY': 10,
      'PLASTIC': 15,
      'MIXED': 2,
    };

    const pointsAwarded = Math.round(weightKg * (pointsMultiplier[wasteType] || 0));

    const transaction = await WasteTransaction.create({
      citizenId: citizen._id,
      collectorId: req.user!.id,
      wasteType,
      weightKg,
      pointsAwarded,
    });

    citizen.points += pointsAwarded;
    citizen.carbonSavedKg += weightKg * 0.5;
    await citizen.save();

    // ── Push real-time SSE notification to citizen ──
    notifyCitizen(cleanQr, {
      type: 'COLLECTION_LOGGED',
      transaction: {
        wasteType,
        weightKg,
        pointsAwarded,
        createdAt: new Date().toISOString(),
      },
      newPoints: citizen.points,
      collectorName: collector.name,
      citizenName: citizen.name,
    });

    res.json({
      message: 'Waste logged successfully',
      transaction,
      newCitizenPoints: citizen.points,
      citizenName: citizen.name,
      collectorName: collector.name,
    });
  } catch (error) {
    console.error('scan-waste error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Collector Dashboard — stats + today's route
router.get('/dashboard', authenticateToken, requireRole('COLLECTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const collector = await User.findById(req.user!.id);
    if (!collector) {
      res.status(404).json({ message: 'Collector not found' });
      return;
    }

    const allTransactions = await WasteTransaction.find({ collectorId: req.user!.id })
      .populate('citizenId', 'name qrCode');

    const totalCollections = allTransactions.length;
    const totalWeightKg = allTransactions.reduce((sum, t) => sum + t.weightKg, 0);

    // Today's transactions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayHistory = allTransactions.filter(
      (t) => new Date(t.createdAt) >= startOfDay
    );

    // Segregation quality breakdown (by wasteType)
    const properCount = allTransactions.filter((t) => t.wasteType !== 'MIXED').length;
    const mixedCount = allTransactions.filter((t) => t.wasteType === 'MIXED').length;
    const properPct = totalCollections > 0 ? Math.round((properCount / totalCollections) * 100) : 0;
    const nonePct = totalCollections > 0 ? Math.round((mixedCount / totalCollections) * 100) : 0;
    const partialPct = 100 - properPct - nonePct;

    // Weekly collections grouped by day-of-week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekMap: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    allTransactions
      .filter((t) => new Date(t.createdAt) >= weekStart)
      .forEach((t) => {
        const day = days[new Date(t.createdAt).getDay()];
        weekMap[day] = (weekMap[day] || 0) + 1;
      });

    const weeklyData = days.map((day) => ({ day, collections: weekMap[day] }));

    res.json({
      name: collector.name,
      collectorId: `C-${collector._id.toString().slice(-4).toUpperCase()}`,
      todayCount: todayHistory.length,
      totalCollections,
      totalWeightKg: Math.round(totalWeightKg * 10) / 10,
      properPct,
      partialPct: Math.max(0, partialPct),
      nonePct,
      weeklyData,
      todayHistory: todayHistory.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update the authenticated collector's latest truck location.
router.put('/location', authenticateToken, requireRole('COLLECTOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, accuracy, timestamp } = req.body;
    if (!isValidCoordinate(lat, -90, 90) || !isValidCoordinate(lng, -180, 180)) {
      res.status(400).json({ message: 'Valid latitude and longitude coordinates are required.' });
      return;
    }
    if (accuracy !== undefined && !isValidAccuracy(accuracy)) {
      res.status(400).json({ message: 'Accuracy must be a non-negative number.' });
      return;
    }

    const gpsTimestamp = timestamp === undefined ? new Date() : new Date(timestamp);
    if (Number.isNaN(gpsTimestamp.getTime())) {
      res.status(400).json({ message: 'Timestamp must be a valid date.' });
      return;
    }

    const updatedAt = new Date();
    const collector = await User.findOneAndUpdate(
      { _id: req.user!.id, role: 'COLLECTOR' },
      { $set: { location: { lat, lng, accuracy, timestamp: gpsTimestamp, updatedAt } } },
      { new: true, select: 'name location' }
    );

    if (!collector) {
      res.status(404).json({ message: 'Collector not found.' });
      return;
    }

    res.json({ message: 'Location updated.', location: collector.location });
  } catch (error) {
    console.error('collector location update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// A collector may only retrieve their own location. Admins can view all current locations.
router.get('/locations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.user?.role === 'ADMIN'
      ? { role: 'COLLECTOR' }
      : req.user?.role === 'COLLECTOR'
        ? { _id: req.user.id, role: 'COLLECTOR' }
        : null;

    if (!filter) {
      res.status(403).json({ message: 'Forbidden: Collector locations are restricted.' });
      return;
    }

    const collectors = await User.find(filter).select('name role location');
    res.json(
      collectors
        .filter((collector) => collector.location?.lat !== undefined && collector.location?.lng !== undefined)
        .map((collector) => ({
          id: collector._id.toString(),
          name: collector.name,
          location: collector.location,
        }))
    );
  } catch (error) {
    console.error('collector locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
