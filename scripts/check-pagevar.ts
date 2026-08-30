import { chromium } from 'playwright';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  let requests: string[] = [];
  p.on('request', r => { if (r.url().includes('/admin/crud/todo')) requests.push(r.url()); });
  await p.goto('http://localhost:3000/admin/login');
  await p.fill('input#email', 'admin@ai-headless.local');
  await p.fill('input#password', 'admin123');
  await Promise.all([p.waitForURL(u => !u.toString().includes('/login')), p.click('button[type=submit]')]);
  await p.goto('http://localhost:3000/admin/crud/todo?pageSize=5&page=1', { waitUntil: 'networkidle' });
  console.log('Server requests for /admin/crud/todo:');
  requests.forEach(r => console.log('  ' + r));
  console.log(`Total: ${requests.length}`);
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
