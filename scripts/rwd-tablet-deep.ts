/**
 * Tablet 深度 debug v2 — 模擬「開新對話」後的內容，檢查 sidebar 內是否撐爆
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const WIDTHS = [768, 834, 1024, 1280];

async function main() {
  const browser = await chromium.launch();
  console.log('\n=== Tablet sidebar 深度 debug（建立多個 session 模擬真實狀態）===\n');

  for (const w of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: w, height: 1024 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 建 3 個 session 模擬內容
    for (let i = 0; i < 3; i++) {
      const btn = await page.$('[data-testid="new-chat-button"]');
      if (btn) await btn.click();
      await page.waitForTimeout(150);
    }

    // 量每個 session 按鈕的實際寬度 vs 容器
    const sessionInfo = await page.evaluate(() => {
      const aside = document.querySelector('[data-testid="chat-sidebar"]');
      if (!aside) return null;
      const asideRect = aside.getBoundingClientRect();
      const sessions = Array.from(document.querySelectorAll('[data-testid^="session-"]'));
      return {
        asideW: asideRect.width,
        sessions: sessions.map((s) => {
          const r = s.getBoundingClientRect();
          return {
            testid: s.getAttribute('data-testid'),
            x: Math.round(r.x),
            w: Math.round(r.width),
            textOverflow: r.width > asideRect.width + 1,
            innerText: (s.textContent || '').trim().slice(0, 30),
          };
        }),
        // 看 sidebar 內是否有任何子元素撐爆
        overflows: Array.from(aside.querySelectorAll('*'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > asideRect.right + 1 && r.width > 0;
          })
          .slice(0, 3)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 20)}" right=${Math.round(r.right)}`;
          }),
      };
    });

    console.log(`\n--- vp=${w}px ---`);
    if (!sessionInfo) {
      console.log('  ❌ 找不到 sidebar');
    } else {
      console.log(`  sidebar 寬: ${sessionInfo.asideW}px`);
      for (const s of sessionInfo.sessions) {
        console.log(`    session: x=${s.x} w=${s.w} text="${s.innerText}"`);
      }
      if (sessionInfo.overflows.length) {
        console.log(`  ⚠️ sidebar 內子元素溢出: ${sessionInfo.overflows.join(' | ')}`);
      } else {
        console.log(`  ✅ sidebar 內無溢出`);
      }
    }

    await context.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
