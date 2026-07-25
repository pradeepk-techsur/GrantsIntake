import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';
import { requireRole } from '../../src/middleware/requireRole';
import { authenticate } from '../../src/middleware/authenticate';
import { Router } from 'express';

// Register test-only routes for RBAC testing BEFORE finalizing app (before 404 handler)
const testRouter = Router();
testRouter.get(
  '/admin-only',
  authenticate,
  requireRole('grantor_admin'),
  (_req, res) => res.json({ ok: true }),
);
testRouter.get(
  '/program-officer-only',
  authenticate,
  requireRole('program_officer'),
  (_req, res) => res.json({ ok: true }),
);
app.use('/api/v1/test', testRouter);

// Register the 404 handler after test routes
finalizeApp();

const UNIQUE_ID = Date.now().toString();
const TEST_EMAIL = `test.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Test User';

let accessToken: string;
let refreshToken: string;
let userId: string;

describe('Auth API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data from prior runs
    // Note: audit_events is immutable (trigger blocks DELETE/UPDATE by design).
    // We cannot clean up audit_events rows — this is intentional for production;
    // in a real test setup, a dedicated test schema or DB would be used.
    // Clean up test user's roles and the user itself (order matters due to FKs)
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
      // Cannot delete audit_events due to immutability trigger — accepted limitation
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
  });

  afterAll(async () => {
    // Close connections only — test data cleanup handled in beforeAll
    await pool.end();
    await closeRedisClient();
  });

  // ─── Registration ─────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201 with tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, full_name: TEST_NAME });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        user: {
          email: TEST_EMAIL,
          full_name: TEST_NAME,
        },
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });
      expect(res.body.user.user_id).toBeDefined();
      userId = res.body.user.user_id;
    });

    it('should return 409 for duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, full_name: TEST_NAME });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_TAKEN');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: TEST_EMAIL });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: TEST_PASSWORD, full_name: TEST_NAME });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'another@example.com', password: 'weak', full_name: TEST_NAME });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return 200 with tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        user: {
          email: TEST_EMAIL,
          full_name: TEST_NAME,
        },
        access_token: expect.any(String),
        refresh_token: expect.any(String),
      });

      accessToken = res.body.access_token;
      refreshToken = res.body.refresh_token;
    });

    it('should write GRANTOR_LOGIN audit event on login', async () => {
      // Login again to ensure audit event
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(loginRes.status).toBe(200);
      const loggedUserId = loginRes.body.user.user_id;

      // Check audit_events table
      const auditResult = await pool.query(
        `SELECT event_type, entity_type, entity_id, actor_user_id
         FROM audit_events
         WHERE event_type = 'GRANTOR_LOGIN' AND actor_user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [loggedUserId],
      );

      expect(auditResult.rows.length).toBeGreaterThan(0);
      expect(auditResult.rows[0].event_type).toBe('GRANTOR_LOGIN');
      expect(auditResult.rows[0].entity_type).toBe('user');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });
  });

  // ─── Refresh ──────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('should return a new access token for a valid refresh token', async () => {
      // Get fresh tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const freshRefreshToken = loginRes.body.refresh_token;

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: freshRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(typeof res.body.access_token).toBe('string');
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid.token.here' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_TOKEN');
    });

    it('should return 401 for expired/invalid JWT', async () => {
      // Use a structurally valid JWT with wrong signature
      const fakeToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwianRpIjoiZmFrZSJ9.wrongsig';
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: fakeToken });

      expect(res.status).toBe(401);
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should revoke refresh token and return 204', async () => {
      // Get fresh tokens
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const freshAccessToken = loginRes.body.access_token;
      const freshRefreshToken = loginRes.body.refresh_token;

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${freshAccessToken}`)
        .send({ refresh_token: freshRefreshToken });

      expect(logoutRes.status).toBe(204);

      // Try to refresh with the revoked token — should fail
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: freshRefreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.error).toBe('INVALID_TOKEN');
    });
  });

  // ─── Me ───────────────────────────────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('should return user with memberships for valid token', async () => {
      // Get a fresh access token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const freshAccessToken = loginRes.body.access_token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${freshAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        user: {
          email: TEST_EMAIL,
          full_name: TEST_NAME,
        },
        grantor_memberships: expect.any(Array),
        org_memberships: expect.any(Array),
      });
    });

    it('should return 401 for missing token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid/expired token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });
  });

  // ─── RBAC ─────────────────────────────────────────────────────────────────

  describe('RBAC enforcement via requireRole', () => {
    let adminAccessToken: string;

    beforeAll(async () => {
      // Login as admin@example.gov who has grantor_admin role
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.gov', password: 'TestPassword123!' });

      expect(loginRes.status).toBe(200);
      adminAccessToken = loginRes.body.access_token;
    });

    it('should return 200 for grantor_admin on admin-only route', async () => {
      const res = await request(app)
        .get('/api/v1/test/admin-only')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 403 for user without program_officer role on program-officer-only route', async () => {
      // TEST_EMAIL user has no grantor roles (new user, no org assignment)
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      const userAccessToken = loginRes.body.access_token;

      const res = await request(app)
        .get('/api/v1/test/program-officer-only')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('PERMISSION_DENIED');
    });

    it('should return 401 without auth token on protected route', async () => {
      const res = await request(app).get('/api/v1/test/admin-only');
      expect(res.status).toBe(401);
    });
  });
});
