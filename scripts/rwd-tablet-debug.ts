/**
 * Tablet RWD 深度 debug — 專門看 sidebar 跟 main 的關係
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';

// 768~1024 之間每 64px 跑一次，看 sidebar 行為
const WIDTHS = [768, 832, 896, 960, 1024, 1280];

async function main() {
  const browser = await chromium.launch();
  console.log('\n=== Tablet sidebar 行為 debug ===\n');

  for (const w of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: w, height: 1024 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // 找所有 sidebar 跟 main，量 rect
    const layout = await page.evaluate(() => {
      const aside = document.querySelector('[data-testid="chat-sidebar"]');
      const main = document.querySelector('main');
      const menuBtn = document.querySelector('[data-testid="mobile-menu-button"]');
      const mobileSidebar = document.querySelector('[data-testid="mobile-sidebar"]');

      const asideR = aside ? aside.getBoundingClientRect() : null;
      const asideCS = aside ? getComputedStyle(aside) : null;
      const mainR = main ? main.getBoundingClientRect() : null;
      const mainCS = main ? getComputedStyle(main) : null;
      const menuR = menuBtn ? menuBtn.getBoundingClientRect() : null;
      const menuCS = menuBtn ? getComputedStyle(menuBtn) : null;
      const mobR = mobileSidebar ? mobileSidebar.getBoundingClientRect() : null;
      const mobCS = mobileSidebar ? getComputedStyle(mobileSidebar) : null;

      return {
        vp: window.innerWidth,
        aside: asideR ? { x: Math.round(asideR.x), y: Math.round(asideR.y), w: Math.round(asideR.width), h: Math.round(asideR.height), display: asideCS!.display, position: asideCS!.position } : null,
        main: mainR ? { x: Math.round(mainR.x), y: Math.round(mainR.y), w: Math.round(mainR.width), h: Math.round(mainR.height), display: mainCS!.display, position: mainCS!.position } : null,
        menuBtn: menuR ? { x: Math.round(menuR.x), y: Math.round(menuR.y), w: Math.round(menuR.width), h: Math.round(menuR.height), display: menuCS!.display, position: menuCS!.position } : null,
        mobileSidebar: mobR ? { x: Math.round(mobR.x), y: Math.round(mobR.y), w: Math.round(mobR.width), h: Math.round(mobR.height), display: mobCS!.display, position: mobCS!.position } : null,
        bodyOverflow: document.body.scrollWidth,
      };
    });

    console.log(`\n--- vp=${w}px ---`);
    console.log(`  sidebar (aside):`, layout.aside);
    console.log(`  main          :`, layout.main);
    console.log(`  漢堡按鈕      :`, layout.menuBtn);
    console.log(`  mobile overlay:`, layout.mobileSidebar);
    console.log(`  bodyScroll    :`, layout.bodyOverflow);

    // 檢查 main 是否有被擋
    if (layout.main && layout.aside) {
      const overlap = layout.aside.x + layout.aside.w > layout.main.x;
      console.log(`  ⚠️ sidebar 跟 main 重疊？`, overlap ? '是 ❌' : '否 ✅');
    }

    await page.screenshot({
      path: `test-results/rwd-audit/debug-tablet-${w}.png`,
      fullPage: false,
    });

    await context.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
