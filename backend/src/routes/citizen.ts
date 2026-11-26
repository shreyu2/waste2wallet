import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { WasteTransaction } from '../models/WasteTransaction';
import { generateQrBase64 } from '../utils/qrHelper';

const router = Router();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Get Citizen Dashboard Data
router.get('/dashboard', authenticateToken, requireRole('CITIZEN'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'Citizen not found' });
      return;
    }

    const recentHistory = await WasteTransaction.find({ citizenId: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('collectorId', 'name');

    let qrBase64 = '';
    if (user.qrCode) {
        try {
            qrBase64 = await generateQrBase64(user.qrCode);
        } catch (err) {
            console.error('QR generation failed:', err);
        }
    }

    res.json({
      wallet: {
        points: user.points,
        carbonSavedKg: user.carbonSavedKg,
        streakWeeks: user.streakWeeks,
        level: user.level,
      },
      qrCode: user.qrCode,
      qrBase64: qrBase64,
      recentHistory,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ALL Citizen Transactions (for portfolio charts)
router.get('/transactions', authenticateToken, requireRole('CITIZEN'), async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await WasteTransaction.find({ citizenId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate('collectorId', 'name');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Citizen Location
router.put('/location', authenticateToken, requireRole('CITIZEN'), async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ message: 'Valid lat and lng numeric coordinates are required' });
      return;
    }
    await User.findByIdAndUpdate(req.user!.id, { location: { lat, lng } });
    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
