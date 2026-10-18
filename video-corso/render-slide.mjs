import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const base = process.argv[2], out = process.argv[3];
const deck = JSON.parse(fs.readFileSync(base + '/project/deck.json'));
const assets = {};
for (const f of fs.readdirSync(base)) { const m = f.match(/^([0-9a-f]{32})\.(png|jpg)$/); if (m) assets[m[1]] = 'file://' + base + '/' + f; }
const glyph = {Warning:'⚠',Check:'✓',Activity:'〰',Chart:'▤',Clock:'◷',Home:'⌂',Lightning:'ϟ',Search:'⌕',Settings:'⚙',Tool:'✚',Users:'●●'};
const css = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden}
section{position:relative;width:1920px;height:1080px;overflow:hidden}
ul,ol{padding-left:1.2em}
table{border-collapse:collapse;width:100%}th,td{padding:14px 20px;text-align:left;vertical-align:top}th{font-weight:700}
x-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;font-weight:700}
x-shape{display:block;flex:none}
x-shape[kind=arrow-right]{clip-path:polygon(0 30%,60% 30%,60% 0,100% 50%,60% 100%,60% 70%,0 70%)}
x-shape[kind=ellipse]{border-radius:50%}x-shape[kind=rounded]{border-radius:16px}
aside{display:none}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
let i = 0;
for (const id of deck.order) {
  i++;
  let html = fs.readFileSync(`${base}/project/slides/${id}.html`, 'utf8');
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (_, a) => assets[a] || '');
  html = html.replace(/<x-icon name="(\w+)" style="([^"]*)"><\/x-icon>/g, (_, n, s) => {
    const w = (s.match(/width:(\d+)px/) || [0, 44])[1];
    return `<x-icon name="${n}" style="${s};font-size:${Math.round(w * 0.8)}px">${glyph[n] || '•'}</x-icon>`;
  });
  const doc = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet"><style>${css}</style></head><body>${html}</body></html>`;
  fs.writeFileSync(`${out}/tmp.html`, doc);
  await page.goto('file://' + out + '/tmp.html', { waitUntil: 'networkidle' }).catch(()=>{});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${id}.png` });
}
await browser.close();
console.log('rendered', i);
