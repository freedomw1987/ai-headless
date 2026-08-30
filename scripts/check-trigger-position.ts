import { chromium } from 'playwright';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/admin/login');
  await p.fill('input#email', 'admin@ai-headless.local');
  await p.fill('input#password', 'admin123');
  await Promise.all([p.waitForURL(u => !u.toString().includes('/login')), p.click('button[type=submit]')]);
  await p.goto('http://localhost:3000/admin/crud/todo?pageSize=5&page=1', { waitUntil: 'domcontentloaded' });
  // 立即看 trigger 位置（不等 networkidle，避免累積 scroll）
  const info = await p.evaluate(() => {
    const trigger = document.querySelector('[data-testid="infinite-scroll-sentinel"]') as HTMLElement;
    if (!trigger) return { found: false };
    const rect = trigger.getBoundingClientRect();
    return {
      found: true,
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      viewportH: window.innerHeight,
      pageH: document.documentElement.scrollHeight,
      inViewport: rect.y < window.innerHeight,
      isIntersecting: rect.y < window.innerHeight + 200,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
