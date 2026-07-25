import { SignJWT, jwtVerify } from 'jose';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { TokenPayload } from '../../types/auth';
import { GrantorRole } from '../../types/roles';

// Lazy-initialize redis client to avoid connecting on import
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    await redisClient.connect();
  }
  return redisClient;
}

export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

function getAccessSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_ACCESS_SECRET);
}

function getRefreshSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_REFRESH_SECRET);
}

/**
 * Sign a HS256 access token with 15 min TTL.
 */
export async function signAccessToken(
  userId: string,
  email: string,
  fullName: string,
  roles: GrantorRole[],
): Promise<string> {
  const payload: Record<string, unknown> = {
    sub: userId,
    email,
    full_name: fullName,
    roles,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(getAccessSecret());
}

/**
 * Sign a HS256 refresh token with 7-day TTL and unique jti.
 */
export async function signRefreshToken(userId: string): Promise<{ token: string; jti: string }> {
  const jti = uuidv4();

  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .sign(getRefreshSecret());

  return { token, jti };
}

/**
 * Verify an access token and return the decoded payload.
 * Throws on invalid or expired token.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());

  return {
    sub: payload.sub as string,
    email: payload['email'] as string,
    full_name: payload['full_name'] as string,
    roles: (payload['roles'] as GrantorRole[]) ?? [],
    jti: payload.jti,
  };
}

/**
 * Verify a refresh token and return its decoded payload.
 * Throws on invalid or expired token.
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string; jti: string }> {
  const { payload } = await jwtVerify(token, getRefreshSecret());

  return {
    userId: payload.sub as string,
    jti: payload.jti as string,
  };
}

/**
 * Store a refresh token JTI in Redis with TTL.
 * Key: refresh:{userId}:{jti}
 */
export async function storeRefreshToken(
  userId: string,
  jti: string,
  ttlSeconds: number = REFRESH_TOKEN_TTL,
): Promise<void> {
  const client = await getRedisClient();
  const key = `refresh:${userId}:${jti}`;
  await client.set(key, '1', { EX: ttlSeconds });
}

/**
 * Delete a refresh token from Redis, invalidating it.
 */
export async function revokeRefreshToken(userId: string, jti: string): Promise<void> {
  const client = await getRedisClient();
  const key = `refresh:${userId}:${jti}`;
  await client.del(key);
}

/**
 * Check whether a refresh token JTI is still valid in Redis.
 */
export async function isRefreshTokenValid(userId: string, jti: string): Promise<boolean> {
  const client = await getRedisClient();
  const key = `refresh:${userId}:${jti}`;
  const value = await client.get(key);
  return value !== null;
}
