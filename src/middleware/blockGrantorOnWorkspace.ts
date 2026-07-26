import { Request, Response, NextFunction } from 'express';
import { GRANTOR_ROLES } from '../types/roles';

/**
 * Workspace draft privacy middleware (PRD-INTAKE-036 / F35).
 * Blocks ALL grantor roles from accessing workspace endpoints
 * while the workspace remains in grantee_private visibility.
 *
 * Enforcement is at middleware layer — not just UI-hidden.
 * Applied to ALL routes in workspacesRouter (not just comments).
 *
 * T-04-07: grantor enumeration prevention — 403 (not 404) is correct here
 * because workspace existence is not secret from authenticated users;
 * only the content is grantee-private.
 */
export function blockGrantorOnWorkspace(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    // authenticate middleware runs before this; if user is missing, let authenticate handle it
    next();
    return;
  }

  const isGrantor = GRANTOR_ROLES.some((role) => req.user!.roles.includes(role));
  if (isGrantor) {
    res.status(403).json({
      error: 'WORKSPACE_GRANTEE_PRIVATE',
      message: 'Workspace content is grantee-private and not accessible to grantor roles during draft',
    });
    return;
  }

  next();
}
