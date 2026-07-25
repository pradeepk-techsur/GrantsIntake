import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth/tokenService';
import { AuthUser } from '../types/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, validates it,
 * and attaches req.user = { user_id, email, full_name, roles } on success.
 * Returns 401 if token is missing, malformed, or invalid.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Bearer token required' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyAccessToken(token);

    req.user = {
      user_id: payload.sub,
      email: payload.email,
      full_name: payload.full_name,
      roles: payload.roles,
    };

    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}
