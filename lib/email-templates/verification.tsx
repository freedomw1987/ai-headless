/**
 * ==============================================
 *  Email Verification Template (Sprint 56 P0-1)
 * ==============================================
 *
 * 使用 React Email 的 render() 把 React 元件渲染成 HTML
 * 不會送到 client bundle — 純 server-side render
 *
 * 對應 docs/sprint56-plan-gate.md §2.2
 */

import * as React from 'react';
import { Html, Head, Body, Container, Text, Link, Preview } from 'react-email';

export type VerificationEmailProps = {
  url: string;
  expiresInHours?: number;
};

export function VerificationEmail({
  url,
  expiresInHours = 24,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your ai-headless account</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#f6f9fc', padding: '20px' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 600 }}>
            歡迎加入 ai-headless
          </Text>
          <Text style={{ fontSize: '16px', color: '#525252' }}>
            請點擊下方按鈕驗證你的 email 以啟用帳號：
          </Text>
          <Link
            href={url}
            style={{
              display: 'inline-block',
              background: '#0066ff',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              marginTop: '16px',
            }}
          >
            驗證我的帳號
          </Link>
          <Text style={{ fontSize: '14px', color: '#737373', marginTop: '24px' }}>
            或複製以下連結到瀏覽器：
          </Text>
          <Text style={{ fontSize: '12px', color: '#a3a3a3', wordBreak: 'break-all' }}>
            {url}
          </Text>
          <Text style={{ fontSize: '14px', color: '#737373', marginTop: '24px' }}>
            此連結將在 {expiresInHours} 小時後失效。
          </Text>
          <Text style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '32px' }}>
            如果你沒有註冊 ai-headless 帳號，請忽略此信。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationEmail;
