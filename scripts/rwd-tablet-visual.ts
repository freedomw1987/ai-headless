/**
 * Tablet 視覺重疊檢測 v3 — 用字串 evaluate 避開 tsx __name 問題
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const WIDTHS = [768, 834, 1024];

const EVAL_FN = `(() => {
  const aside = document.querySelector('[data-testid="chat-sidebar"]');
  const main = document.querySelector('main');
  if (!aside || !main) return null;
  const asideR = aside.getBoundingClientRect();
  const mainR = main.getBoundingClientRect();
  const sidebarHeader = aside.querySelector('.border-b');
  const mainHeader = main.querySelector('header');
  const sidebarNewBtn = aside.querySelector('[data-testid="new-chat-button"]');
  const mainH1 = main.querySelector('h1');
  const rectOf = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    aside: rectOf(aside),
    main: rectOf(main),
    sidebarHeader: rectOf(sidebarHeader),
    sidebarNewBtn: rectOf(sidebarNewBtn),
    mainHeader: rectOf(mainHeader),
    mainH1: rectOf(mainH1),
    firstMainChildX: main.firstElementChild ? Math.round(main.firstElementChild.getBoundingClientRect().x) : null,
  };
})()`;

async function main() {
  const browser = await chromium.launch();
  console.log('\n=== Tablet 視覺重疊檢測 v3 ===\n');

  for (const w of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: w, height: 1024 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(BASE + '/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const overlap = await page.evaluate(EVAL_FN);

    console.log(`\n--- vp=${w}px ---`);
    console.log('  aside:', overlap?.aside);
    console.log('  main :', overlap?.main);
    console.log('  sidebar 內 border-b:', overlap?.sidebarHeader);
    console.log('  sidebar 內 新對話按鈕:', overlap?.sidebarNewBtn);
    console.log('  main 內 header  :', overlap?.mainHeader);
    console.log('  main 內 h1      :', overlap?.mainH1);
    console.log('  main 內首個元素 x:', overlap?.firstMainChildX);

    if (overlap?.aside && overlap?.mainHeader) {
      const asideRight = overlap.aside.x + overlap.aside.w;
      const overlapX = Math.max(0, asideRight - overlap.mainHeader.x);
      console.log(`  aside 右邊 vs main header 起點：aside right=${asideRight}, main x=${overlap.mainHeader.x}, 重疊 ${overlapX}px`);
    }

    await context.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
