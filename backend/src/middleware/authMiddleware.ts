import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ message: 'JWT authentication is not configured' });
    return;
  }

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      // Distinguish expired tokens from other errors
      const message =
        err.name === 'TokenExpiredError'
          ? 'Token has expired — please log in again'
          : 'Invalid or expired token';
      res.status(401).json({ message });
      return;
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  });
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: `Forbidden: Requires ${role} role` });
      return;
    }
    next();
  };
};
