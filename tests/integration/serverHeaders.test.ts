import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

describe('Server Security Headers — iframe preview compatibility', () => {
  afterAll(async () => {
    await pool.end();
    await closeRedisClient();
  });

  it('does NOT send cross-origin-opener-policy header (blocks iframe preview if set)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['cross-origin-opener-policy']).toBeUndefined();
  });

  it('does NOT send cross-origin-resource-policy header (blocks iframe resource load if set)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['cross-origin-resource-policy']).toBeUndefined();
  });

  it('does NOT send cross-origin-embedder-policy header (blocks cross-origin embedding if set)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['cross-origin-embedder-policy']).toBeUndefined();
  });
});
