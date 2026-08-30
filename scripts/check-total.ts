import { chromium } from 'playwright';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/admin/login');
  await p.fill('input#email', 'admin@ai-headless.local');
  await p.fill('input#password', 'admin123');
  await Promise.all([p.waitForURL(u => !u.toString().includes('/login')), p.click('button[type=submit]')]);
  await p.goto('http://localhost:3000/admin/crud/todo?pageSize=5&page=1', { waitUntil: 'networkidle' });
  const txt = await p.evaluate(() => document.body.innerText);
  const m = txt.match(/共 (\d+) 筆資料/);
  console.log('Total:', m ? m[1] : 'NOT FOUND');
  console.log('---');
  // 看「已載入 X / Y」
  const m2 = txt.match(/已載入 (\d+) \/ (\d+)/);
  console.log('Loaded:', m2 ? `${m2[1]} / ${m2[2]}` : 'NOT FOUND');
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
