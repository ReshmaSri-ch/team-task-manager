import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import prisma from '../config/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    const secret = process.env.JWT_SECRET || 'AntigravitySuperSecureJwtSecretToken';

    jwt.verify(token, secret, (err, decoded: any) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
      }
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header is missing.' });
  }
};

export const requireSystemAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }

  next();
};

export const requireProjectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // Find Project ID. In routes, it might be req.params.projectId or req.params.id (for project resource)
  const projectId = req.params.projectId || req.params.id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required for validation.' });
  }

  try {
    // Admins bypass project membership checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: projectId
        }
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error during authorization.' });
  }
};

export const requireProjectAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const projectId = req.params.projectId || req.params.id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required for validation.' });
  }

  try {
    // Admins bypass checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId: projectId
        }
      }
    });

    if (!member || member.role !== 'PROJECT_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Project Administrator permissions required.' });
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error during authorization.' });
  }
};
