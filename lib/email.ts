/**
 * ==============================================
 *  Email Service — Sprint 56 R2 + P0-1 + P0-2
 * ==============================================
 *
 * 統一 SMTP 包用，提供：
 * - sendEmail(options): 寄出 email
 * - isEmailConfigured(): 檢查環境變數是否齊全
 *
 * 設計：
 * - dev 環境用 ethereal.email（fake SMTP，自動給預覽連結）
 * - production 用環境變數設定的真實 SMTP（Resend / SendGrid / 任何 SMTP）
 * - 抽象成 transporter，業務邏輯（forgot-password/verify）不直接碰 nodemailer
 *
 * 對應 docs/sprint56-plan-gate.md §2.1 + §3
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ==============================================
// Types
// ==============================================

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailSendResult = {
  messageId: string;
  previewUrl?: string; // ethereal 專用
};

// ==============================================
// 環境變數檢查
// ==============================================

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

// ==============================================
// Transporter Factory
// ==============================================

let cachedTransporter: Transporter | null = null;

/**
 * 取得 transporter（單例）
 *
 * dev 環境（NODE_ENV=development 且 SMTP_HOST 未設定）→ ethereal.email fake SMTP
 * production → 用環境變數的真實 SMTP
 */
export async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  // dev 環境：ethereal.email fake SMTP
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return cachedTransporter;
  }

  // production：真實 SMTP
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  return cachedTransporter;
}

// ==============================================
// 寄信主函式
// ==============================================

/**
 * 寄出 email
 *
 * 永遠 throw on failure（讓 caller 知道失敗）
 * 成功回傳 { messageId, previewUrl? }
 */
export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  const transporter = await getTransporter();

  const from = process.env.SMTP_FROM ?? 'noreply@ai-headless.local';

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? stripHtml(options.html),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

// ==============================================
// Helpers
// ==============================================

/**
 * 簡易 HTML → text 轉換（去掉 tag，保留純文字）
 * 用在 text/plain fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==============================================
// 測試 helper: 重置 cache
// ==============================================

/**
 * 測試用：清掉 cached transporter
 * vitest 環境需要這個避免污染下一個測試
 */
export function _resetTransporterCacheForTesting(): void {
  cachedTransporter = null;
}
