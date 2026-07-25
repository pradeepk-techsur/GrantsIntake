import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `guidance-${Date.now()}`;
const TEST_EMAIL = `guidance.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let accessToken: string;
let testUserId: string;
let testOrgId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Guidance Prompts API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existingUser.rows.length > 0) {
      const uid = existingUser.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    // Create test user and org
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const userResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, 'Guidance Test User', hash],
    );
    testUserId = userResult.rows[0].user_id;

    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org Guidance ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );

    accessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  describe('GET /api/v1/guidance-prompts', () => {
    it('returns 200 with 5 seeded guidance prompts', async () => {
      const res = await request(app)
        .get('/api/v1/guidance-prompts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);

      // Verify all 5 expected field_ids are present
      const fieldIds = res.body.map((p: { field_id: string }) => p.field_id);
      expect(fieldIds).toContain('executive_summary');
      expect(fieldIds).toContain('eligibility_summary');
      expect(fieldIds).toContain('contact_name');
      expect(fieldIds).toContain('contact_email');
      expect(fieldIds).toContain('program_area');
    });

    it('each prompt has required fields (prompt_id, field_id, prompt_text)', async () => {
      const res = await request(app)
        .get('/api/v1/guidance-prompts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      for (const prompt of res.body) {
        expect(prompt.prompt_id).toBeTruthy();
        expect(prompt.field_id).toBeTruthy();
        expect(prompt.prompt_text).toBeTruthy();
      }
    });

    it('prompts include example_text and uswds_tips', async () => {
      const res = await request(app)
        .get('/api/v1/guidance-prompts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      // At least some prompts should have example_text and uswds_tips
      const hasExampleText = res.body.some((p: { example_text: string | null }) => p.example_text != null);
      const hasUswdsTips = res.body.some((p: { uswds_tips: unknown[] | null }) => p.uswds_tips != null);
      expect(hasExampleText).toBe(true);
      expect(hasUswdsTips).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/guidance-prompts');
      expect(res.status).toBe(401);
    });
  });
});
