/**
 * TDD Gate 1 — S3.2 Event Extension 整合測試
 *
 * 涵蓋：
 * 1. Event + Registration 兩個 Model
 * 2. datetime 欄位驗證
 * 3. 多對多 Relation (Event ↔ Registration)
 * 4. 容量檢查 Hook
 * 5. 報名 Action（容量 + 重複檢查）
 * 6. 狀態機 Workflow (upcoming → ongoing → past / cancelled)
 * 7. Computed (availableSeats / isFull / isUpcoming)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateJsonSpec } from '@/lib/specs/json-spec.validator';
import type { JsonSpec } from '@/lib/specs/json-spec.types';

import { beforeCreateEvent } from '@/extensions/event/hooks/before-create';
import { beforeRegister } from '@/extensions/event/hooks/before-register';
import { availableSeats } from '@/extensions/event/computed/available-seats';
import { isFull } from '@/extensions/event/computed/is-full';
import { isUpcoming } from '@/extensions/event/computed/is-upcoming';
import { registerAttendee } from '@/extensions/event/actions/register-attendee';
import { cancelEvent } from '@/extensions/event/actions/cancel-event';
import { eventLifecycle } from '@/extensions/event/workflows/lifecycle';
import { createStateMachine } from '@/lib/workflows/workflow-engine';

// ==============================================
// 1. Event Extension Manifest
// ==============================================

describe('S3.2 Event Extension Manifest', () => {
  it('manifest 存在且可載入', () => {
    const manifestPath = path.join(
      process.cwd(),
      'extensions/event/manifest.json',
    );
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.name).toBe('event');
    expect(parsed.workflows).toContain('event.lifecycle');
    expect(parsed.computed).toContain('event.availableSeats');
  });
});

// ==============================================
// 2. Event JsonSpec
// ==============================================

describe('S3.2 Event JsonSpec', () => {
  let eventSpec: JsonSpec;

  it('event-spec.json 通過 validator', () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/event/event-spec.json'),
      'utf-8',
    );
    eventSpec = JSON.parse(raw);
    expect(() => validateJsonSpec(eventSpec)).not.toThrow();
  });

  it('含 Event + Registration 兩個 Model', () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/event/event-spec.json'),
      'utf-8',
    );
    eventSpec = JSON.parse(raw);
    const modelNames = eventSpec.models.map((m) => m.name);
    expect(modelNames).toContain('Event');
    expect(modelNames).toContain('Registration');
  });

  it('Event 有 datetime 欄位 + 容量 + 狀態 enum', () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/event/event-spec.json'),
      'utf-8',
    );
    eventSpec = JSON.parse(raw);
    const event = eventSpec.models.find((m) => m.name === 'Event')!;

    const fieldNames = event.fields.map((f) => f.name);
    expect(fieldNames).toEqual(
      expect.arrayContaining(['startAt', 'endAt', 'capacity', 'status']),
    );

    const startAt = event.fields.find((f) => f.name === 'startAt')!;
    expect(startAt.type).toBe('datetime');
    expect(startAt.validation?.required).toBe(true);
  });

  it('Event 含 3 個 computed + 1 個 workflow', () => {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'extensions/event/event-spec.json'),
      'utf-8',
    );
    eventSpec = JSON.parse(raw);
    const event = eventSpec.models.find((m) => m.name === 'Event')!;

    expect(event.computed).toHaveLength(3);
    expect(event.workflows).toHaveLength(1);
    expect(event.workflows![0]!.initialState).toBe('upcoming');
  });
});

// ==============================================
// 3. Prisma Schema 生成
// ==============================================

describe('S3.2 Event → Prisma Schema', () => {
  it('Sprint 14: Prisma schema 含 Event + EventRegistration', () => {
    // Sprint 14: compiler 已移除，Prisma schema 由 prisma/schema.prisma 手動維護
    const prisma = fs.readFileSync(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf-8',
    );
    expect(prisma).toContain('model Event');
    expect(prisma).toContain('model EventRegistration');
    expect(prisma).toContain('startAt');
    expect(prisma).toContain('endAt');
    expect(prisma).toContain('capacity');
    expect(prisma).toContain('eventId');
  });
});

// ==============================================
// 4. Hook 驗證
// ==============================================

describe('S3.2 Event beforeCreate Hook', () => {
  it('startAt < endAt 通過', async () => {
    const ctx = {
      model: 'Event',
      
      data: {
        title: 'Test',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 172800000).toISOString(),
      },
    };

    const result = await beforeCreateEvent(ctx);
    expect(result.title).toBe('Test');
  });

  it('startAt >= endAt 報錯', async () => {
    const ctx = {
      model: 'Event',
      
      data: {
        title: 'Test',
        startAt: new Date(Date.now() + 172800000).toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      },
    };

    await expect(beforeCreateEvent(ctx)).rejects.toThrow(
      'startAt must be before endAt',
    );
  });

  it('過去時間的 startAt 報錯', async () => {
    const ctx = {
      model: 'Event',
      
      data: {
        title: 'Test',
        startAt: new Date(Date.now() - 86400000).toISOString(),
        endAt: new Date(Date.now() + 86400000).toISOString(),
      },
    };

    await expect(beforeCreateEvent(ctx)).rejects.toThrow(
      'must be in the future',
    );
  });

  it('capacity < 0 報錯', async () => {
    const ctx = {
      model: 'Event',
      
      data: {
        title: 'Test',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 172800000).toISOString(),
        capacity: -1,
      },
    };

    await expect(beforeCreateEvent(ctx)).rejects.toThrow(
      'capacity must be >= 0',
    );
  });

  it('自動設定 status = upcoming', async () => {
    const ctx = {
      model: 'Event',
      
      data: {
        title: 'Test',
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 172800000).toISOString(),
      },
    };

    const result = await beforeCreateEvent(ctx);
    expect(result.status).toBe('upcoming');
  });
});

// ==============================================
// 5. Computed
// ==============================================

describe('S3.2 Event Computed', () => {
  it('availableSeats：capacity=50, registered=10 → 40', () => {
    expect(
      availableSeats({ capacity: 50, status: 'upcoming', registeredCount: 10 }),
    ).toBe(40);
  });

  it('availableSeats：capacity=0 → -1（不限）', () => {
    expect(availableSeats({ capacity: 0, registeredCount: 100 })).toBe(-1);
  });

  it('availableSeats：cancelled → 0', () => {
    expect(
      availableSeats({ capacity: 50, status: 'cancelled', registeredCount: 10 }),
    ).toBe(0);
  });

  it('isFull：registeredCount >= capacity', () => {
    expect(isFull({ capacity: 50, registeredCount: 50 })).toBe(true);
    expect(isFull({ capacity: 50, registeredCount: 49 })).toBe(false);
  });

  it('isUpcoming：startAt 未來 → true', () => {
    expect(
      isUpcoming({ status: 'upcoming', startAt: new Date(Date.now() + 86400000).toISOString() }),
    ).toBe(true);
  });

  it('isUpcoming：cancelled → false', () => {
    expect(
      isUpcoming({ status: 'cancelled', startAt: new Date(Date.now() + 86400000).toISOString() }),
    ).toBe(false);
  });
});

// ==============================================
// 6. Action：registerAttendee
// ==============================================

describe('S3.2 Event Action: registerAttendee', () => {
  it('報名成功', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', capacity: 50, status: 'upcoming' },
      ctx: { existingCount: 10, alreadyRegistered: false },
    };

    const result = await registerAttendee({ userId: 'user-1' }, ctx);

    expect(result.eventId).toBe('event-1');
    expect(result.userId).toBe('user-1');
    expect(result.registeredAt).toBeTruthy();
  });

  it('重複報名報錯', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', capacity: 50, status: 'upcoming' },
      ctx: { existingCount: 10, alreadyRegistered: true },
    };

    await expect(registerAttendee({ userId: 'user-1' }, ctx)).rejects.toThrow(
      'already registered',
    );
  });

  it('已取消活動報名報錯', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', capacity: 50, status: 'cancelled' },
      ctx: { existingCount: 10, alreadyRegistered: false },
    };

    await expect(registerAttendee({ userId: 'user-1' }, ctx)).rejects.toThrow(
      'cancelled event',
    );
  });

  it('已額滿活動報名報錯', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', capacity: 50, status: 'upcoming' },
      ctx: { existingCount: 50, alreadyRegistered: false },
    };

    await expect(registerAttendee({ userId: 'user-1' }, ctx)).rejects.toThrow(
      'full',
    );
  });
});

// ==============================================
// 7. Action：cancelEvent
// ==============================================

describe('S3.2 Event Action: cancelEvent', () => {
  it('取消 upcoming 活動', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', status: 'upcoming' },
    };

    const result = await cancelEvent({}, ctx);

    expect(result.status).toBe('cancelled');
    expect(result.cancelledAt).toBeTruthy();
  });

  it('past 活動不可取消', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', status: 'past' },
    };

    await expect(cancelEvent({}, ctx)).rejects.toThrow('past event');
  });

  it('已取消活動不可重複取消', async () => {
    const ctx = {
      model: 'Event' as const,
      data: { id: 'event-1', status: 'cancelled' },
    };

    await expect(cancelEvent({}, ctx)).rejects.toThrow('already cancelled');
  });
});

// ==============================================
// 8. Workflow 狀態機
// ==============================================

describe('S3.2 Event Workflow: lifecycle', () => {
  it('upcoming --START--> ongoing', async () => {
    const machine = createStateMachine(eventLifecycle);
    const result = await machine.transition('upcoming', 'ongoing', {
      entityId: 'event-1',
    });
    if (result.success) {
      expect(result.toState).toBe('ongoing');
    } else {
      throw new Error('Expected success');
    }
  });

  it('ongoing --END--> past', async () => {
    const machine = createStateMachine(eventLifecycle);
    const result = await machine.transition('ongoing', 'past', {
      entityId: 'event-1',
    });
    if (result.success) {
      expect(result.toState).toBe('past');
    } else {
      throw new Error('Expected success');
    }
  });

  it('upcoming --CANCEL--> cancelled', async () => {
    const machine = createStateMachine(eventLifecycle);
    const result = await machine.transition('upcoming', 'cancelled', {
      entityId: 'event-1',
    });
    if (result.success) {
      expect(result.toState).toBe('cancelled');
    } else {
      throw new Error('Expected success');
    }
  });

  it('past 不可再轉移（INVALID_TRANSITION）', async () => {
    const machine = createStateMachine(eventLifecycle);
    const result = await machine.transition('past', 'past', {
      entityId: 'event-1',
    });
    expect(result.success).toBe(false);
  });
});

// ==============================================
// 9. 跨模組整合：建立 → 報名 → 額滿 → 取消
// ==============================================

describe('S3.2 Event 跨模組整合', () => {
  it('完整流程：建立活動 → 多次報名 → 額滿 → 取消', async () => {
    // 1. 建立活動
    const start = new Date(Date.now() + 86400000);
    const end = new Date(Date.now() + 172800000);
    const created = await beforeCreateEvent({
      model: 'Event',
      
      data: {
        title: 'AI Conference',
        capacity: 2,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      },
    });

    expect(created.status).toBe('upcoming');
    expect(availableSeats({ capacity: 2, status: 'upcoming', registeredCount: 0 })).toBe(2);

    // 2. 第一個報名
    const reg1 = await registerAttendee(
      { userId: 'user-1' },
      {
        model: 'Event' as const,
        data: { id: 'event-1', capacity: 2, status: 'upcoming' },
        ctx: { existingCount: 0, alreadyRegistered: false },
      },
    );
    expect(reg1.userId).toBe('user-1');

    // 3. 第二個報名
    const reg2 = await registerAttendee(
      { userId: 'user-2' },
      {
        model: 'Event' as const,
        data: { id: 'event-1', capacity: 2, status: 'upcoming' },
        ctx: { existingCount: 1, alreadyRegistered: false },
      },
    );
    expect(reg2.userId).toBe('user-2');

    // 4. 第三個報名 → 應失敗（已額滿）
    await expect(
      registerAttendee(
        { userId: 'user-3' },
        {
          model: 'Event' as const,
          data: { id: 'event-1', capacity: 2, status: 'upcoming' },
          ctx: { existingCount: 2, alreadyRegistered: false },
        },
      ),
    ).rejects.toThrow('full');

    // 5. isFull = true
    expect(isFull({ capacity: 2, registeredCount: 2, status: 'upcoming' })).toBe(true);

    // 6. 取消活動
    const cancelled = await cancelEvent(
      {},
      { model: 'Event', data: { ...created, status: 'upcoming' } },
    );
    expect(cancelled.status).toBe('cancelled');

    // 7. 已取消後不能再報名
    await expect(
      registerAttendee(
        { userId: 'user-4' },
        {
          model: 'Event' as const,
          data: { id: 'event-1', capacity: 2, status: 'cancelled' },
          ctx: { existingCount: 2, alreadyRegistered: false },
        },
      ),
    ).rejects.toThrow('cancelled event');
  });
});