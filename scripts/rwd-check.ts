/**
 * RWD 程式化檢測
 * 不依賴視覺比對，直接量 DOM 客觀指標：
 *
 * 1. documentElement.scrollWidth > viewport.width → 水平溢出（最常見的 RWD bug）
 * 2. overflow-x 被刻意設成 hidden（治標不治本）
 * 3. meta[name=viewport] 缺失或內容錯誤
 * 4. 過小的可點擊區（< 24px）
 * 5. 文字溢出容器（text 寬度 > 父容器）
 * 6. fixed/sticky 元素擋住內容
 */
import { chromium, Page } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'pad', width: 768, height: 1024 },
  { name: 'pc', width: 1280, height: 800 },
];

const ROUTES = [
  { path: '/', label: 'home' },
  { path: '/chat', label: 'chat' },
  { path: '/admin/login', label: 'admin-login' },
  { path: '/admin', label: 'admin-dashboard' },
  { path: '/admin/users', label: 'admin-users' },
  { path: '/admin/roles', label: 'admin-roles' },
  { path: '/admin/extensions', label: 'admin-extensions' },
];

type Finding = {
  viewport: string;
  route: string;
  issues: string[];
};

async function inspect(page: Page, viewport: { name: string; width: number; height: number }, route: { path: string; label: string }): Promise<Finding> {
  const issues: string[] = [];

  // 等網路穩定 + 字體（先 goto 再檢查，避免 hydration 順序問題）
  await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 15_000 });
  await page.waitForTimeout(800);

  // 0. viewport meta（每個頁面都需要）
  const viewportMeta = await page.evaluate(() => {
    const m = document.querySelector('meta[name="viewport"]');
    return m ? m.getAttribute('content') : null;
  });
  if (!viewportMeta) {
    issues.push('缺少 <meta name="viewport">');
  } else if (!viewportMeta.includes('width=device-width')) {
    issues.push(`viewport meta 異常：${viewportMeta}`);
  }

  const { finalUrl } = { finalUrl: page.url() };

  // 1. 水平溢出
  const overflow = await page.evaluate((vw: number) => {
    const docW = document.documentElement.scrollWidth;
    const bodyW = document.body.scrollWidth;
    return {
      docScrollWidth: docW,
      bodyScrollWidth: bodyW,
      viewportWidth: vw,
      docOverflow: docW - vw,
      bodyOverflow: bodyW - vw,
      // 找哪些元素超出 viewport
      culprits: Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.right > vw + 1 && r.width > 0;
        })
        .slice(0, 5)
        .map((el) => {
          const r = el.getBoundingClientRect();
          const sel =
            (el.tagName.toLowerCase()) +
            (el.id ? `#${el.id}` : '') +
            (typeof el.className === 'string' && el.className
              ? '.' + el.className.split(/\s+/).slice(0, 3).join('.')
              : '');
          return `${sel.slice(0, 80)} right=${Math.round(r.right)}px`;
        }),
    };
  }, viewport.width);

  if (overflow.docOverflow > 1) {
    issues.push(
      `水平溢出 doc=${overflow.docScrollWidth}px > vp=${overflow.viewportWidth}px（超出 ${overflow.docOverflow}px）。溢出元素範例：${overflow.culprits.join(' | ') || '無'}`
    );
  }

  // 2. 治標：overflow-x: hidden 設在 html/body
  const hiddenOverflow = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement).overflowX;
    const body = getComputedStyle(document.body).overflowX;
    return { html, body };
  });
  if (hiddenOverflow.html === 'hidden' || hiddenOverflow.body === 'hidden') {
    issues.push(
      `⚠️ 用 overflow-x:hidden 治標（html=${hiddenOverflow.html}, body=${hiddenOverflow.body}），底下可能仍有溢出元素沒被修`
    );
  }

  // 3. 小於 24px 的可點擊元素（accessibility / mobile UX）
  const smallTargets = await page.evaluate(() => {
    const targets = Array.from(document.querySelectorAll('button, a, [role="button"], input, select, textarea'));
    const small: string[] = [];
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // 只關心目前 viewport 內的
      if (r.right < 0 || r.left > window.innerWidth) continue;
      if (r.width < 24 || r.height < 24) {
        const text = (el.textContent || '').trim().slice(0, 20);
        small.push(`<${el.tagName.toLowerCase()}> "${text}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return small.slice(0, 5);
  });
  if (smallTargets.length > 0) {
    issues.push(`過小可點擊元素（< 24px）：${smallTargets.join(' | ')}`);
  }

  // 4. 文字溢出：innerText 寬度超過容器
  //    簡化版：找 nowrap 的純文字節點
  const textOverflow = await page.evaluate(() => {
    const issues: string[] = [];
    const all = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, td, th, li, a, button, label'));
    for (const el of all) {
      const range = document.createRange();
      try {
        range.selectNodeContents(el);
        const rect = range.getBoundingClientRect();
        const parent = el.parentElement;
        if (!parent) continue;
        const pr = parent.getBoundingClientRect();
        if (rect.width > pr.width + 2 && rect.width > 0 && pr.width > 0) {
          const text = (el.textContent || '').trim().slice(0, 30);
          issues.push(`文字溢出容器 "${text}" text=${Math.round(rect.width)}px > parent=${Math.round(pr.width)}px`);
        }
      } catch {}
    }
    return issues.slice(0, 3);
  });
  if (textOverflow.length > 0) {
    issues.push(`文字溢出：${textOverflow.join(' | ')}`);
  }

  // 5. fixed/sticky 元素遮擋
  const fixedBlocking = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const fixed: string[] = [];
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      // mobile 寬度下，fixed 元素 > 80% 視寬可能擋住
      if (cs.position === 'fixed' && r.width > window.innerWidth * 0.8 && r.height > window.innerHeight * 0.5) {
        fixed.push(`<${el.tagName.toLowerCase()}> ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return fixed;
  });
  if (fixedBlocking.length > 0) {
    issues.push(`fixed 元素過大可能遮擋：${fixedBlocking.join(' | ')}`);
  }

  if (finalUrl !== BASE + route.path && !finalUrl.includes('/admin/login')) {
    issues.push(`跳轉：${route.path} → ${finalUrl}`);
  }

  return { viewport: viewport.name, route: route.label, issues };
}

async function main() {
  const browser = await chromium.launch();
  const findings: Finding[] = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    for (const r of ROUTES) {
      const f = await inspect(page, vp, r);
      findings.push(f);
    }
    await context.close();
  }
  await browser.close();

  console.log('\n========== RWD 程式化檢測報告 ==========\n');
  const totalIssues = findings.reduce((acc, f) => acc + f.issues.length, 0);
  console.log(`總掃描：${findings.length} 個（vp × route）`);
  console.log(`總問題數：${totalIssues}\n`);

  // 按 viewport 分組
  for (const vp of VIEWPORTS) {
    console.log(`\n── ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ──`);
    const group = findings.filter((f) => f.viewport === vp.name);
    for (const f of group) {
      if (f.issues.length === 0) {
        console.log(`  ✅ ${f.route}`);
      } else {
        console.log(`  ❌ ${f.route}`);
        for (const i of f.issues) console.log(`     - ${i}`);
      }
    }
  }

  console.log('\n========== 摘要 ==========');
  const cleanOnAllVp = findings.filter((f) => f.issues.length === 0).length;
  const dirtyOnAnyVp = findings.filter((f) => f.issues.length > 0);
  console.log(`三斷點全乾淨：${cleanOnAllVp}/${findings.length}`);
  console.log(`有問題的組合：${dirtyOnAnyVp.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
