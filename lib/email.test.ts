/**
 * Email Service Tests — Sprint 56 R2
 *
 * Mock pattern: 直接 mock 函式 export（cjs interop safe）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 創建 mock 函式（vi.hoisted 讓 vi.mock factory 能引用）
const { mockCreateTestAccount, mockCreateTransport, mockGetTestMessageUrl } = vi.hoisted(() => ({
  mockCreateTestAccount: vi.fn(),
  mockCreateTransport: vi.fn(),
  mockGetTestMessageUrl: vi.fn(),
}));

// mock 整個 nodemailer 模組
vi.mock('nodemailer', () => ({
  default: {
    createTestAccount: mockCreateTestAccount,
    createTransport: mockCreateTransport,
    getTestMessageUrl: mockGetTestMessageUrl,
  },
  createTestAccount: mockCreateTestAccount,
  createTransport: mockCreateTransport,
  getTestMessageUrl: mockGetTestMessageUrl,
}));

import { isEmailConfigured, _resetTransporterCacheForTesting, getTransporter } from './email';

describe('isEmailConfigured', () => {
  beforeEach(() => {
    _resetTransporterCacheForTesting();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when no SMTP env vars set', () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it('returns false when only some SMTP env vars set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    expect(isEmailConfigured()).toBe(false);
  });

  it('returns true when all required SMTP env vars set', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'noreply@example.com';
    expect(isEmailConfigured()).toBe(true);
  });
});

describe('getTransporter (mocked)', () => {
  beforeEach(() => {
    _resetTransporterCacheForTesting();
    mockCreateTestAccount.mockReset();
    mockCreateTransport.mockReset();
    mockGetTestMessageUrl.mockReset();

    delete process.env.SMTP_HOST;
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses ethereal.email in dev when SMTP_HOST not set', async () => {
    mockCreateTestAccount.mockResolvedValue({
      user: 'test-user@ethereal.email',
      pass: 'test-pass',
    } as never);
    mockCreateTransport.mockReturnValue({
      sendMail: vi.fn(),
    } as never);

    await getTransporter();

    expect(mockCreateTestAccount).toHaveBeenCalled();
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.ethereal.email',
        port: 587,
      }),
    );
  });

  it('uses real SMTP when SMTP_HOST is set', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'resend';
    process.env.SMTP_PASS = 're_xxx';
    process.env.SMTP_FROM = 'noreply@example.com';

    mockCreateTransport.mockReturnValue({
      sendMail: vi.fn(),
    } as never);

    await getTransporter();

    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.resend.com',
        port: 587,
      }),
    );
  });

  it('caches transporter (singleton)', async () => {
    mockCreateTestAccount.mockResolvedValue({
      user: 'test-user@ethereal.email',
      pass: 'test-pass',
    } as never);
    mockCreateTransport.mockReturnValue({
      sendMail: vi.fn(),
    } as never);

    const t1 = await getTransporter();
    const t2 = await getTransporter();
    expect(t1).toBe(t2);
  });
});
