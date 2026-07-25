import { Request, Response, NextFunction, RequestHandler } from 'express';
import { GrantorRole } from '../types/roles';

/**
 * Role-based access control middleware factory.
 * Returns a middleware that checks req.user has at least one of the specified roles.
 * Returns 403 with { error: 'PERMISSION_DENIED' } if role check fails.
 * Requires authenticate middleware to have run first (req.user must exist).
 */
export function requireRole(...roles: GrantorRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles ?? [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'PERMISSION_DENIED' });
      return;
    }

    next();
  };
}
