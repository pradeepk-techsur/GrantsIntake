import { GrantorRole } from './roles';

export interface AuthUser {
  user_id: string;
  email: string;
  full_name: string;
  roles: GrantorRole[];
}

export interface TokenPayload {
  sub: string;         // user_id
  email: string;
  full_name: string;
  roles: GrantorRole[];
  jti?: string;        // JWT ID (for refresh tokens)
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  user: {
    user_id: string;
    email: string;
    full_name: string;
    roles: GrantorRole[];
  };
  access_token: string;
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface MeResponse {
  user: {
    user_id: string;
    email: string;
    full_name: string;
    created_at: Date;
    last_login_at: Date | null;
  };
  grantor_memberships: Array<{
    org_id: string;
    org_name: string;
    org_type: string | null;
    roles: GrantorRole[];
  }>;
  org_memberships: unknown[];
}
