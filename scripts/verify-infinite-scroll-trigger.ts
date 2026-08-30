/**
 * Sprint A 驗證腳本 — 無限滾動 trigger 真實瀏覽器行為
 *
 * 目的: 確認 InfiniteScrollTrigger 在真實瀏覽器中
 *   1. 預設顯示在列表底部
 *   2. hasMore=true 時顯示「捲動以載入更多」
 *   3. scroll 到 sentinel 真的觸發 router.push
 *   4. hasMore=false 時顯示「已顯示全部」
 *
 * 截圖放在 test-results/rwd-audit/infinite-scroll-{viewport}.png
 */

import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_DIR = resolve('test-results/rwd-audit');
mkdirSync(OUT_DIR, { recursive: true });

const SPEC = process.argv[2] ?? 'todo';
const EMAIL = 'admin@ai-headless.local';
const PASSWORD = 'admin123';

async function login(page) {
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input#email', EMAIL);
  await page.fill('input#password', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function checkInfiniteScroll(viewport, vpName) {
  const browser = await chromium.launch();
  const context = await browser.newContext(viewport);
  const page = await context.newPage();

  console.log(`\n[${vpName}] 開始驗證...`);

  await login(page);

  const url = `http://localhost:3000/admin/crud/${SPEC}?pageSize=5`;
  await page.goto(url, { waitUntil: 'networkidle' });

  const sentinelExists = await page.locator('[data-testid="infinite-scroll-sentinel"]').count();
  console.log(`  sentinel 存在: ${sentinelExists > 0 ? '✅' : '❌'} (count=${sentinelExists})`);

  if (sentinelExists === 0) {
    const endText = await page.locator('[data-testid="infinite-scroll-end"]').textContent().catch(() => null);
    console.log(`  end text: ${endText ?? '(none)'}`);
  }

  await page.screenshot({
    path: resolve(OUT_DIR, `infinite-scroll-${vpName}.png`),
    fullPage: true,
  });

  const triggerInfo = await page.evaluate(() => {
    const sentinel = document.querySelector('[data-testid="infinite-scroll-sentinel"]');
    const end = document.querySelector('[data-testid="infinite-scroll-end"]');
    const target = (sentinel ?? end);
    if (!target) return { found: false };
    const rect = target.getBoundingClientRect();
    return {
      found: true,
      text: target.textContent?.trim() ?? '',
      kind: sentinel ? 'sentinel' : 'end',
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      viewportHeight: window.innerHeight,
      pageHeight: document.documentElement.scrollHeight,
    };
  });

  console.log(`  trigger info:`, JSON.stringify(triggerInfo, null, 2));

  if (triggerInfo.kind === 'sentinel') {
    const beforeUrl = page.url();
    await page.locator('[data-testid="infinite-scroll-sentinel"]').scrollIntoViewIfNeeded();
    await page.waitForURL((url) => url.toString() !== beforeUrl, { timeout: 5000 }).catch(() => {});
    const afterUrl = page.url();
    console.log(`  scroll 前 URL: ${beforeUrl}`);
    console.log(`  scroll 後 URL: ${afterUrl}`);
    console.log(`  URL 有變化: ${beforeUrl !== afterUrl ? '✅' : '❌'}`);

    await page.screenshot({
      path: resolve(OUT_DIR, `infinite-scroll-after-${vpName}.png`),
      fullPage: true,
    });
  }

  await browser.close();
  return triggerInfo;
}

async function main() {
  console.log(`Sprint A 驗證 — spec: ${SPEC}`);

  const desktopResult = await checkInfiniteScroll({ width: 1280, height: 800 }, 'desktop-1280');
  const mobileResult = await checkInfiniteScroll(devices['iPhone 13'], 'mobile-iphone13');

  const summary = {
    spec: SPEC,
    desktop: desktopResult,
    mobile: mobileResult,
  };
  writeFileSync(resolve(OUT_DIR, 'infinite-scroll-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\n📝 Summary 寫到 ${OUT_DIR}/infinite-scroll-summary.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
