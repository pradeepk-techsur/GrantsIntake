import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import * as authService from '../services/auth/authService';
import { verifyRefreshToken } from '../services/auth/tokenService';
import { authenticate } from '../middleware/authenticate';

export const authRouter = Router();

// Rate limiting: 20 req/min per IP on auth routes (T-01-05 mitigations)
// In test mode, allow higher limits to avoid rate-limiting during integration tests
const authRateLimitMax = process.env.NODE_ENV === 'test' ? 1000 : 20;
const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' },
});

authRouter.use(authRateLimit);

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  full_name: z.string().min(1, 'Full name is required').max(250, 'Full name too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/v1/auth/register
 * Create a new user account and return tokens.
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: firstError.message,
      field: firstError.path[0],
    });
    return;
  }

  const { email, password, full_name } = parsed.data;

  try {
    const result = await authService.register(email, password, full_name);
    res.status(201).json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; status?: number; message?: string };
    if (error.code === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email address already registered' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Registration failed' });
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate with email/password and return tokens.
 * Writes GRANTOR_LOGIN audit event on success.
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: firstError.message,
      field: firstError.path[0],
    });
    return;
  }

  const { email, password } = parsed.data;
  const ipAddress = req.ip || req.socket.remoteAddress;

  try {
    const result = await authService.login(email, password, ipAddress);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; status?: number; message?: string };
    if (error.code === 'INVALID_CREDENTIALS' || error.code === 'ACCOUNT_INACTIVE') {
      res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Exchange a valid refresh token for a new access token.
 */
authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'refresh_token is required' });
    return;
  }

  const { refresh_token } = parsed.data;

  try {
    const result = await authService.refresh(refresh_token);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; status?: number; message?: string };
    if (
      error.code === 'INVALID_TOKEN' ||
      error.code === 'TOKEN_REVOKED' ||
      error.code === 'USER_NOT_FOUND'
    ) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' });
      return;
    }
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Token refresh failed' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Invalidate the refresh token. Returns 204 No Content.
 */
authRouter.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  const parsed = refreshSchema.safeParse(req.body);

  if (!parsed.success || !req.user) {
    // Still return 204 to avoid information leakage
    res.status(204).send();
    return;
  }

  try {
    const { refresh_token } = parsed.data;
    const decoded = await verifyRefreshToken(refresh_token);
    await authService.logout(decoded.userId, decoded.jti);
  } catch {
    // Silently ignore errors; logout should always "succeed" from client perspective
  }

  res.status(204).send();
});

/**
 * GET /api/v1/auth/me
 * Return the authenticated user with grantor and org memberships.
 */
authRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.getMe(req.user!.user_id);
    res.status(200).json(result);
  } catch (err: unknown) {
    const error = err as { code?: string; status?: number; message?: string };
    if (error.code === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
      return;
    }
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch user' });
  }
});
