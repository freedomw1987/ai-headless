import { chromium } from 'playwright';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  p.on('console', m => console.log(`[browser ${m.type()}] ${m.text()}`));
  await p.goto('http://localhost:3000/admin/login');
  await p.fill('input#email', 'admin@ai-headless.local');
  await p.fill('input#password', 'admin123');
  await Promise.all([p.waitForURL(u => !u.toString().includes('/login')), p.click('button[type=submit]')]);
  await p.goto('http://localhost:3000/admin/crud/todo?pageSize=5&page=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
