import { pool } from '../../db/client';
import { hashPassword, comparePassword } from './passwordService';
import {
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  isRefreshTokenValid,
  verifyRefreshToken,
} from './tokenService';
import { AuthResponse, MeResponse, RefreshResponse } from '../../types/auth';
import { GrantorRole } from '../../types/roles';

interface UserRow {
  user_id: string;
  email: string;
  full_name: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

interface GrantorRoleRow {
  org_id: string;
  org_name: string;
  org_type: string | null;
  roles: GrantorRole[];
}

/**
 * Register a new user.
 * Returns auth tokens on success.
 * Throws AppError with code EMAIL_TAKEN if email already exists.
 */
export async function register(
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing user
  const existing = await pool.query<UserRow>(
    'SELECT user_id FROM users WHERE email = $1',
    [normalizedEmail],
  );

  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Email already registered'), {
      code: 'EMAIL_TAKEN',
      status: 409,
    });
  }

  const passwordHash = await hashPassword(password);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (email, full_name, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, email, full_name, created_at`,
    [normalizedEmail, fullName, passwordHash],
  );

  const user = result.rows[0];
  const roles: GrantorRole[] = [];

  const { token: refreshToken, jti } = await signRefreshToken(user.user_id);
  await storeRefreshToken(user.user_id, jti);
  const accessToken = await signAccessToken(user.user_id, user.email, user.full_name, roles);

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      roles,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Authenticate a user with email and password.
 * Writes a GRANTOR_LOGIN audit event on success.
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
): Promise<AuthResponse> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query<UserRow>(
    'SELECT user_id, email, full_name, password_hash, is_active FROM users WHERE email = $1',
    [normalizedEmail],
  );

  if (result.rows.length === 0) {
    // Perform a dummy hash comparison to prevent timing attacks
    await comparePassword(password, '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    throw Object.assign(new Error('Invalid credentials'), {
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw Object.assign(new Error('Account is inactive'), {
      code: 'ACCOUNT_INACTIVE',
      status: 401,
    });
  }

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    throw Object.assign(new Error('Invalid credentials'), {
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
  }

  // Update last_login_at
  await pool.query(
    'UPDATE users SET last_login_at = now() WHERE user_id = $1',
    [user.user_id],
  );

  // Get user's grantor roles
  const rolesResult = await pool.query<{ roles: GrantorRole[] }>(
    `SELECT roles FROM grantor_roles
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [user.user_id],
  );

  const roles: GrantorRole[] = [];
  for (const row of rolesResult.rows) {
    if (Array.isArray(row.roles)) {
      roles.push(...(row.roles as GrantorRole[]));
    }
  }

  // Write GRANTOR_LOGIN audit event (immutable)
  await pool.query(
    `INSERT INTO audit_events (event_type, entity_type, entity_id, actor_user_id, actor_ip, payload)
     VALUES ($1, $2, $3, $4, $5::inet, $6::jsonb)`,
    [
      'GRANTOR_LOGIN',
      'user',
      user.user_id,
      user.user_id,
      ipAddress || null,
      JSON.stringify({ email: user.email }),
    ],
  );

  const { token: refreshToken, jti } = await signRefreshToken(user.user_id);
  await storeRefreshToken(user.user_id, jti);
  const accessToken = await signAccessToken(user.user_id, user.email, user.full_name, roles);

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      roles,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

/**
 * Issue a new access token using a valid refresh token.
 * Validates token signature and checks Redis for validity.
 */
export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  let userId: string;
  let jti: string;

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    userId = decoded.userId;
    jti = decoded.jti;
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), {
      code: 'INVALID_TOKEN',
      status: 401,
    });
  }

  const valid = await isRefreshTokenValid(userId, jti);
  if (!valid) {
    throw Object.assign(new Error('Refresh token has been revoked'), {
      code: 'TOKEN_REVOKED',
      status: 401,
    });
  }

  // Get current user data
  const result = await pool.query<UserRow>(
    'SELECT user_id, email, full_name, is_active FROM users WHERE user_id = $1',
    [userId],
  );

  if (result.rows.length === 0 || !result.rows[0].is_active) {
    throw Object.assign(new Error('User not found or inactive'), {
      code: 'USER_NOT_FOUND',
      status: 401,
    });
  }

  const user = result.rows[0];

  const rolesResult = await pool.query<{ roles: GrantorRole[] }>(
    `SELECT roles FROM grantor_roles
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [user.user_id],
  );

  const roles: GrantorRole[] = [];
  for (const row of rolesResult.rows) {
    if (Array.isArray(row.roles)) {
      roles.push(...(row.roles as GrantorRole[]));
    }
  }

  const accessToken = await signAccessToken(user.user_id, user.email, user.full_name, roles);

  return { access_token: accessToken };
}

/**
 * Revoke a refresh token, effectively logging out the user.
 */
export async function logout(userId: string, jti: string): Promise<void> {
  await revokeRefreshToken(userId, jti);
}

/**
 * Get the current authenticated user with grantor memberships.
 */
export async function getMe(userId: string): Promise<MeResponse> {
  const userResult = await pool.query<UserRow>(
    'SELECT user_id, email, full_name, created_at, last_login_at FROM users WHERE user_id = $1',
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw Object.assign(new Error('User not found'), {
      code: 'USER_NOT_FOUND',
      status: 404,
    });
  }

  const user = userResult.rows[0];

  const grantorResult = await pool.query<GrantorRoleRow>(
    `SELECT go.org_id, go.org_name, go.org_type, gr.roles
     FROM grantor_roles gr
     JOIN grantor_organizations go ON go.org_id = gr.grantor_org_id
     WHERE gr.user_id = $1 AND gr.revoked_at IS NULL`,
    [userId],
  );

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    },
    grantor_memberships: grantorResult.rows.map((row) => ({
      org_id: row.org_id,
      org_name: row.org_name,
      org_type: row.org_type,
      roles: Array.isArray(row.roles) ? row.roles : [],
    })),
    org_memberships: [],
  };
}
