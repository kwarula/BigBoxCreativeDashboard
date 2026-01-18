/**
 * Authentication Controller
 * User login, signup, and session management
 */

import { Application, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('AuthController');

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Setup Authentication API endpoints
 */
export function setupAuthAPI(app: Application): void {
  // Sign up new user
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, role = 'employee' } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password required',
        });
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          roles: [role],
        },
      });

      if (error) {
        logger.error('Signup failed', { error, email });
        return res.status(400).json({
          error: 'Signup failed',
          message: error.message,
        });
      }

      logger.info('User created successfully', { userId: data.user.id, email, role });

      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          roles: [role],
        },
      });
    } catch (error) {
      logger.error('Signup error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create user',
      });
    }
  });

  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email and password required',
        });
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.warn('Login failed', { error, email });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      const roles = (data.user.user_metadata?.roles as string[]) || ['employee'];

      logger.info('User logged in', { userId: data.user.id, email, roles });

      res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          roles,
        },
      });
    } catch (error) {
      logger.error('Login error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Login failed',
      });
    }
  });

  // Refresh token
  app.post('/api/auth/refresh', async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Refresh token required',
        });
      }

      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        logger.warn('Token refresh failed', { error });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token',
        });
      }

      logger.info('Token refreshed', { userId: data.user?.id });

      res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      });
    } catch (error) {
      logger.error('Token refresh error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Token refresh failed',
      });
    }
  });

  // Get current user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided',
        });
      }

      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }

      const roles = (user.user_metadata?.roles as string[]) || ['employee'];

      res.json({
        user: {
          id: user.id,
          email: user.email,
          roles,
        },
      });
    } catch (error) {
      logger.error('Get user error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user',
      });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({ message: 'Logged out' });
      }

      const token = authHeader.substring(7);
      const supabase = getSupabaseClient();

      await supabase.auth.admin.signOut(token);

      logger.info('User logged out');

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error', { error });
      // Don't fail logout even if backend errors
      res.json({ message: 'Logged out' });
    }
  });

  logger.info('Auth API endpoints registered');
}
