/**
 * Sprint 14 TECH-033 — Dynamic CRUD Route
 *
 * 守護：
 * 1. URL /api/crud/<spec> 對應到正確的 handler
 * 2. list / get / create / update / delete / transition 都能跑
 * 3. 不存在的 spec 回 404
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/crud/[spec]/route';
import { invalidateSpecCache } from '@/lib/runtime/spec-loader';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'admin' },
  }),
}));

function makeRequest(url: string, options: { method?: string; body?: unknown } = {}): NextRequest {
  return {
    url,
    method: options.method ?? 'GET',
    json: async () => options.body ?? {},
  } as unknown as NextRequest;
}

function makeContext(spec: string): { params: Promise<{ spec: string }> } {
  return { params: Promise.resolve({ spec }) };
}

describe('TECH-033 Dynamic Route', () => {
  beforeAll(() => {
    invalidateSpecCache();
  });

  it('GET /api/crud/todo → list 200', async () => {
    const created = await db.todo.create({
      data: { title: 'list test todo' },
    });

    const req = makeRequest('http://localhost/api/crud/todo');
    const resOrErr = await GET(req, makeContext('todo'));
    if (!resOrErr) throw new Error("no response");
    const res = resOrErr;
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toBeDefined();
    expect(Array.isArray(json.items)).toBe(true);

    await db.todo.delete({ where: { id: created.id } });
  });

  it('POST /api/crud/todo → create 201', async () => {
    const req = makeRequest('http://localhost/api/crud/todo', {
      method: 'POST',
      body: { title: 'create test todo' },
    });
    const resOrErr = await POST(req, makeContext('todo'));
    if (!resOrErr) throw new Error("no response");
    const res = resOrErr;
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.title).toBe('create test todo');

    await db.todo.delete({ where: { id: json.id } });
  });

  it('GET /api/crud/not-exist → 404', async () => {
    const req = makeRequest('http://localhost/api/crud/not-exist-spec');
    const resOrErr = await GET(req, makeContext('not-exist-spec'));
    if (!resOrErr) throw new Error("no response");
    const res = resOrErr;

    expect(res.status).toBe(404);
  });

  it('GET /api/crud/todo?id=<id> → get 200', async () => {
    const created = await db.todo.create({
      data: { title: 'single get test' },
    });

    const req = makeRequest(`http://localhost/api/crud/todo?id=${created.id}`);
    const resOrErr = await GET(req, makeContext('todo'));
    if (!resOrErr) throw new Error("no response");
    const res = resOrErr;
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe(created.id);

    await db.todo.delete({ where: { id: created.id } });
  });

  it('PUT /api/crud/todo?id=<id> → update 200', async () => {
    const created = await db.todo.create({
      data: { title: 'update test' },
    });

    const req = makeRequest(`http://localhost/api/crud/todo?id=${created.id}`, {
      method: 'PUT',
      body: { title: 'updated title', completed: true },
    });
    const resOrErr = await PUT(req, makeContext('todo'));
    if (!resOrErr) throw new Error('no response');
    const res = resOrErr;
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.title).toBe('updated title');
    expect(json.completed).toBe(true);

    await db.todo.delete({ where: { id: created.id } });
  });

  it('DELETE /api/crud/todo?id=<id> → 204 (softDelete)', async () => {
    const created = await db.todo.create({
      data: { title: 'delete test' },
    });

    const req = makeRequest(`http://localhost/api/crud/todo?id=${created.id}`, {
      method: 'DELETE',
    });
    const resOrErr = await DELETE(req, makeContext('todo'));
    if (!resOrErr) throw new Error('no response');
    const res = resOrErr;

    expect(res.status).toBe(204);
    const found = await db.todo.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found?.deletedAt).not.toBeNull();
  });

  it('GET /api/crud/todo?id=<id>&event=<event> → transition 400 (todo 沒 workflow)', async () => {
    const created = await db.todo.create({
      data: { title: 'transition test' },
    });

    const req = makeRequest(`http://localhost/api/crud/todo?id=${created.id}&event=submit`);
    const resOrErr = await GET(req, makeContext('todo'));
    if (!resOrErr) throw new Error("no response");
    const res = resOrErr;

    // todo spec 沒 workflow → 400
    expect(res.status).toBe(400);

    await db.todo.delete({ where: { id: created.id } });
  });
});