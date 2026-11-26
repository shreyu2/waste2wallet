import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    if (role && role !== 'CITIZEN') {
      res.status(403).json({ message: 'Only citizen registration is available publicly.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create a mock QR Code for citizens
    const cleanName = name.trim();
    const qrCode = (role === 'CITIZEN' || !role) ? `W2W_${cleanName.substring(0, 3).toUpperCase()}_${Date.now()}` : undefined;

    const newUser = await User.create({
      name: cleanName,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'CITIZEN',
      qrCode
    });

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const payload = {
      id: user._id,
      role: user.role
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: 'JWT authentication is not configured' });
      return;
    }

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        points: user.points,
        qrCode: user.qrCode
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
