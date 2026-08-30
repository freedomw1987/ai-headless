import { chromium, devices } from 'playwright';
async function main() {
  const b = await chromium.launch();
  const ctx = await b.newContext(devices['iPhone 13']);
  const p = await ctx.newPage();
  let reqs: string[] = [];
  p.on('request', r => { if (r.url().includes('/admin/crud/todo') && !r.url().includes('_rsc')) reqs.push(r.url()); });
  await p.goto('http://localhost:3000/admin/login');
  await p.fill('input#email', 'admin@ai-headless.local');
  await p.fill('input#password', 'admin123');
  await Promise.all([p.waitForURL(u => !u.toString().includes('/login')), p.click('button[type=submit]')]);
  await p.goto('http://localhost:3000/admin/crud/todo?pageSize=5&page=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  console.log('Mobile requests:');
  reqs.forEach(r => console.log('  ' + r));
  const info = await p.evaluate(() => {
    const trigger = document.querySelector('[data-testid="infinite-scroll-sentinel"]') as HTMLElement;
    const end = document.querySelector('[data-testid="infinite-scroll-end"]');
    const text = (trigger ?? end)?.textContent;
    return { triggerText: text, finalUrl: location.href };
  });
  console.log('Final:', JSON.stringify(info));
  await b.close();
}
main().catch(e => { console.error(e); process.exit(1); });
