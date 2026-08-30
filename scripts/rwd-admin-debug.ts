/**
 * Admin tablet debug — 驗證 sidebar 是否真的擋住 main
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
const WIDTHS = [375, 613, 640, 768, 834, 1024, 1280];

const EVAL = `(() => {
  const aside = document.querySelector('[data-testid="admin-sidebar"]');
  const mains = Array.from(document.querySelectorAll('main'));
  if (!aside) return { aside: null, mains: [], bodyW: 0 };
  const asideR = aside.getBoundingClientRect();
  const asideCS = getComputedStyle(aside);
  return {
    aside: {
      x: Math.round(asideR.x), y: Math.round(asideR.y),
      w: Math.round(asideR.width), h: Math.round(asideR.height),
      position: asideCS.position,
      transform: asideCS.transform,
      className: aside.className.slice(0, 200),
    },
    mains: mains.map(m => {
      const r = m.getBoundingClientRect();
      const cs = getComputedStyle(m);
      // 內容實際位置：找 main 內「可見」的 h1/h2
      const allHeadings = Array.from(m.querySelectorAll('h1, h2'));
      const visibleHeading = allHeadings.find(h => {
        const r = h.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const inner = visibleHeading;
      const innerR = inner ? inner.getBoundingClientRect() : null;
      const firstChild = m.firstElementChild;
      const childR = firstChild ? firstChild.getBoundingClientRect() : null;
      return {
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
        position: cs.position,
        paddingLeft: cs.paddingLeft,
        className: m.className,
        firstChild: childR ? {
          x: Math.round(childR.x), y: Math.round(childR.y),
          w: Math.round(childR.width), h: Math.round(childR.height),
        } : null,
        innerContent: innerR ? {
          x: Math.round(innerR.x), y: Math.round(innerR.y),
          w: Math.round(innerR.width),
          tag: inner.tagName.toLowerCase(),
          text: (inner.textContent || '').trim().slice(0, 20),
        } : null,
        // 算 main 右邊到視窗右邊的距離（看 pr）
        rightGap: Math.round(window.innerWidth - r.right),
      };
    }),
    bodyW: document.body.scrollWidth,
    vpW: window.innerWidth,
  };
})()`;

async function main() {
  const browser = await chromium.launch();

  for (const w of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: w, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 登入
    await page.goto(BASE + '/admin/login');
    await page.fill('input#email', 'admin@ai-headless.local');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.toString().includes('/admin/login'), { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const info: any = await page.evaluate(EVAL);

    console.log(`\n--- vp=${w}px ---`);
    console.log('  aside class:', info.aside?.className);
    console.log('  aside:', info.aside ? { x: info.aside.x, w: info.aside.w, position: info.aside.position } : null);
    console.log('  main 數量:', info.mains?.length);
    for (let i = 0; i < (info.mains?.length ?? 0); i++) {
      const m = info.mains[i];
      console.log(`  main[${i}]:`, { x: m.x, w: m.w, paddingLeft: m.paddingLeft, rightGap: m.rightGap, className: m.className });
      console.log(`    firstChild (container):`, m.firstChild);
      console.log(`    inner content:`, m.innerContent);
    }
    console.log(`  body scrollW: ${info.bodyW}, vp: ${info.vpW}`);

    if (info.aside && info.mains?.length) {
      const asideRight = info.aside.x + info.aside.w;
      const m = info.mains[0];
      const overlap = Math.max(0, asideRight - m.x);
      console.log(`  ⚠️ aside right=${asideRight} vs main[0] x=${m.x} → 重疊 ${overlap}px`);
      if (m.innerContent) {
        const blocked = m.innerContent.x < asideRight;
        console.log(`  ⚠️ 內容 "${m.innerContent.text}" x=${m.innerContent.x} vs asideRight=${asideRight} → 內容被 sidebar 擋住？ ${blocked ? '是 ❌' : '否 ✅'}`);
        // 對稱檢查：內容 x 與 (vp - 內容 right) 應該相等
        const contentRight = m.innerContent.x + m.innerContent.w;
        const leftGap = m.innerContent.x - asideRight;
        const rightGap = info.vpW - contentRight;
        console.log(`  📐 左 gap (內容 vs sidebar): ${leftGap}px, 右 gap (內容 vs viewport): ${rightGap}px, 對稱？ ${leftGap === rightGap ? '✅' : `差 ${Math.abs(leftGap - rightGap)}px ⚠️`}`);
        // 漢堡按鈕擋住檢查（檢查實際重疊區域）
        const burgerBtn = await page.$('[data-testid="mobile-menu-button"]');
        if (burgerBtn) {
          const burgerBox = await burgerBtn.boundingBox();
          const burgerVisible = await burgerBtn.isVisible();
          if (burgerVisible && burgerBox && m.innerContent) {
            const burgerRight = burgerBox.x + burgerBox.width;
            const burgerBottom = burgerBox.y + burgerBox.height;
            const h1 = m.innerContent;
            const h1Right = h1.x + h1.w;
            const h1Bottom = h1.y + (h1.h || 24);
            const xOverlap = burgerRight > h1.x && burgerBox.x < h1Right;
            const yOverlap = burgerBottom > h1.y && burgerBox.y < h1Bottom;
            const actuallyOverlap = xOverlap && yOverlap;
            console.log(`  🍔 漢堡 x=${burgerBox.x}~${burgerRight}, y=${burgerBox.y}~${burgerBottom} vs h1 x=${h1.x}~${h1Right}, y=${h1.y}~${h1Bottom} → 實際重疊？ ${actuallyOverlap ? '❌ 是' : '✅ 否'}`);
          }
        }
      }
    }

    await page.screenshot({
      path: `test-results/rwd-audit/admin-tablet-${w}.png`,
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
