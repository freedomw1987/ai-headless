/**
 * RWD 全面掃描
 * - 三個斷點：mobile (375×812) / pad (768×1024) / pc (1280×800)
 * - 截圖所有可達頁面（公開頁面為主，後台 admin 需要登入會跳轉）
 */
import { chromium, devices, Page } from '@playwright/test';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const OUT = path.resolve(process.cwd(), 'test-results/rwd-audit');

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'pad', width: 768, height: 1024 },
  { name: 'pc', width: 1280, height: 800 },
];

// 公開頁面（不需要登入）
const PUBLIC_ROUTES = [
  { path: '/', label: 'home' },
  { path: '/chat', label: 'chat' },
  { path: '/admin/login', label: 'admin-login' },
];

// 後台頁面（會跳轉回 login，截 login 也行）
const ADMIN_ROUTES = [
  { path: '/admin', label: 'admin-dashboard' },
  { path: '/admin/users', label: 'admin-users' },
  { path: '/admin/roles', label: 'admin-roles' },
  { path: '/admin/extensions', label: 'admin-extensions' },
];

async function shoot(page: Page, viewport: string, route: { path: string; label: string }) {
  const url = BASE + route.path;
  console.log(`[${viewport}] ${url}`);
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 });
    await page.waitForTimeout(500); // 等動畫/字體
    const status = resp?.status() ?? 0;
    const finalUrl = page.url();
    const file = path.join(OUT, viewport, `${route.label}.png`);
    await page.screenshot({ path: file, fullPage: true });
    return { ok: true, status, finalUrl, file };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report: any[] = [];

  for (const vp of VIEWPORTS) {
    await fs.mkdir(path.join(OUT, vp.name), { recursive: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // Console error 收集（白屏/JS 崩潰訊號）
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    for (const r of [...PUBLIC_ROUTES, ...ADMIN_ROUTES]) {
      const res = await shoot(page, vp.name, r);
      report.push({ viewport: vp.name, route: r, ...res, errors: [...errors] });
      errors.length = 0;
    }
    await context.close();
  }
  await browser.close();

  await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n=== RWD 掃描完成 ===');
  console.log(`截圖位置：${OUT}`);
  console.log(`總計：${report.length} 張`);
  const failed = report.filter((r) => !r.ok);
  console.log(`失敗：${failed.length}`);
  if (failed.length) console.log(JSON.stringify(failed, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
