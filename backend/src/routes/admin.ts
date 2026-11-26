import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { WasteTransaction } from '../models/WasteTransaction';
import { STPMetric } from '../models/STPMetric';
import { notifyCitizenDispatch } from './events';
import bcrypt from 'bcryptjs';

const router = Router();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Admin Dashboard — aggregated stats
router.get('/dashboard', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await WasteTransaction.find();
    const totalProcessed = transactions.reduce((acc, curr) => acc + curr.weightKg, 0);

    const segregationData = await WasteTransaction.aggregate([
      { $group: { _id: '$wasteType', value: { $sum: '$weightKg' } } },
    ]);

    const mappedSegregationData = segregationData.map((item) => {
      let color = '#f59e0b';
      if (item._id === 'WET') color = '#10b981';
      if (item._id === 'DRY') color = '#34d399';
      if (item._id === 'PLASTIC') color = '#059669';
      return { name: item._id, value: Math.round(item.value * 10) / 10, color };
    });

    const latestStp = await STPMetric.findOne().sort({ createdAt: -1 });
    const totalCitizens = await User.countDocuments({ role: 'CITIZEN' });
    const totalTransactions = transactions.length;

    // Compute waste impact index: ratio of non-mixed weight to total
    const mixedWeight = transactions
      .filter((t) => t.wasteType === 'MIXED')
      .reduce((s, t) => s + t.weightKg, 0);
    const wasteImpactIndex =
      totalProcessed > 0
        ? Math.round(((totalProcessed - mixedWeight) / totalProcessed) * 100)
        : 0;

    res.json({
      totalProcessed: Math.round(totalProcessed * 10) / 10,
      wasteImpactIndex,
      segregationData: mappedSegregationData,
      stpHealth: latestStp || { mixedWastePercentage: 0, flowRateMLD: 0, efficiencyScore: 100 },
      totalCitizens,
      totalTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Leaderboard — top citizens by points
router.get('/leaderboard', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const topCitizens = await User.find({ role: 'CITIZEN' })
      .sort({ points: -1 })
      .limit(10)
      .select('name points level');

    res.json(topCitizens);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a collector without allowing public role elevation or password sharing.
router.post('/collectors', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!name?.trim() || !normalizedEmail || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({ message: 'A user with that email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const collector = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'COLLECTOR',
    });

    res.status(201).json({
      message: 'Collector created successfully.',
      collector: { id: collector._id, name: collector.name, email: collector.email, role: collector.role },
    });
  } catch (error) {
    console.error('collector creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET dispatchable citizens
router.get('/dispatchable-citizens', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const citizens = await User.find({ role: 'CITIZEN', 'location.lat': { $exists: true } })
      .select('name email location qrCode');
    res.json(citizens);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST dispatch truck to all citizens
router.post('/dispatch', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const citizens = await User.find({ role: 'CITIZEN', 'location.lat': { $exists: true } });
    
    // Default start location (e.g. center of Bangalore)
    const startLocation = { lat: 12.9716, lng: 77.5946 };

    let dispatchedCount = 0;
    for (const citizen of citizens) {
      if (citizen.qrCode && citizen.location && citizen.location.lat !== undefined && citizen.location.lng !== undefined) {
        notifyCitizenDispatch(citizen.qrCode, {
          type: 'TRUCK_DISPATCHED',
          destination: { lat: citizen.location.lat!, lng: citizen.location.lng! },
          startLocation
        });
        dispatchedCount++;
      }
    }

    res.json({ message: `Trucks dispatched to ${dispatchedCount} locations successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
