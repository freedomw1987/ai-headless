/**
 * ==============================================
 *  Password Reset Template (Sprint 56 P0-2)
 * ==============================================
 *
 * 對應 docs/sprint56-plan-gate.md §2.3
 */

import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview } from 'react-email';

export type PasswordResetEmailProps = {
  url: string;
  expiresInMinutes?: number;
};

export function PasswordResetEmail({
  url,
  expiresInMinutes = 60,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your ai-headless password</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#f6f9fc', padding: '20px' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 600 }}>
            重設你的密碼
          </Text>
          <Text style={{ fontSize: '16px', color: '#525252' }}>
            我們收到你重設密碼的請求。請點擊下方按鈕設定新密碼：
          </Text>
          <Link
            href={url}
            style={{
              display: 'inline-block',
              background: '#dc2626',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              marginTop: '16px',
            }}
          >
            重設密碼
          </Link>
          <Text style={{ fontSize: '14px', color: '#737373', marginTop: '24px' }}>
            或複製以下連結到瀏覽器：
          </Text>
          <Text style={{ fontSize: '12px', color: '#a3a3a3', wordBreak: 'break-all' }}>
            {url}
          </Text>
          <Text style={{ fontSize: '14px', color: '#dc2626', marginTop: '24px' }}>
            ⚠️ 此連結將在 {expiresInMinutes} 分鐘後失效，且只能使用一次。
          </Text>
          <Text style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '32px' }}>
            如果你沒有要求重設密碼，請忽略此信 — 你的密碼不會改變。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;
