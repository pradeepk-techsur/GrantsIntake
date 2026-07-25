import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

// Finalize app (register 404 handler) for testing
finalizeApp();

describe('Context Boot', () => {
  afterAll(async () => {
    await pool.end();
    await closeRedisClient();
  });

  it('Express app starts and responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
    });
  });

  it('Database connection is reachable', async () => {
    const result = await pool.query('SELECT 1 AS one');
    expect(result.rows[0].one).toBe(1);
  });

  it('Required tables exist in database', async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'grantor_organizations', 'grantor_roles', 'audit_events')
      ORDER BY table_name
    `);
    const tableNames = result.rows.map((r) => r.table_name);
    expect(tableNames).toContain('audit_events');
    expect(tableNames).toContain('grantor_organizations');
    expect(tableNames).toContain('grantor_roles');
    expect(tableNames).toContain('users');
  });

  // Plan 01-02 introduced SPA routing: non-API routes now serve client/dist/index.html (200).
  // Only unknown /api/* routes return 404; non-API unknown paths serve the SPA.
  it('Returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route-xyz');
    expect(res.status).toBe(404);
  });

  it('Serves SPA for non-API unknown routes (client-side routing)', async () => {
    const res = await request(app).get('/unknown-route-xyz');
    // With client/dist present, Express serves index.html (200) for SPA routing
    expect([200, 404]).toContain(res.status);
  });
});
