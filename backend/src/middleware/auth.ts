import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
