/**
 * Authentication & Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('AuthMiddleware');

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7);

    // Use Supabase to verify JWT
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      logger.warn('Supabase credentials not configured - auth disabled');
      return next(); // Continue without auth in development
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Extract roles from user metadata
    const roles = (user.user_metadata?.roles as string[]) || ['employee'];

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      roles,
    };

    logger.debug('User authenticated', { userId: user.id, email: user.email, roles });

    next();
  } catch (error) {
    logger.error('Token verification failed', { error });
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to verify token',
    });
  }
}

/**
 * Require specific roles (RBAC)
 */
export function requireRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const hasRole = requiredRoles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.id,
        userRoles: req.user.roles,
        requiredRoles,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      });
    }

    logger.debug('Role check passed', {
      userId: req.user.id,
      userRoles: req.user.roles,
      requiredRoles,
    });

    next();
  };
}

/**
 * Optional auth - doesn't fail if no token provided
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No auth provided, continue without user
  }

  // Try to verify but don't fail if it doesn't work
  try {
    await verifyToken(req, res, next);
  } catch (error) {
    logger.debug('Optional auth failed, continuing without user', { error });
    next();
  }
}
