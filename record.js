const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function naturalClick(page, selector) {
  const el = page.locator(selector);
  const box = await el.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.waitForTimeout(180);
  await page.mouse.down();
  await page.waitForTimeout(140);
  await page.mouse.up();
}

(async () => {
  const videosDir = path.join(__dirname, 'videos');
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: videosDir, size: { width: 1280, height: 800 } }
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  // Watch loader count 1–100% naturally
  await page.waitForFunction(() => document.getElementById('loader').classList.contains('done'), { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.waitForSelector('#pill.visible');
  await page.waitForTimeout(700);

  // Click M avatar to expand pill
  await naturalClick(page, '#avatar');
  await page.waitForSelector('#pill.expanded');
  await page.waitForTimeout(700);

  // Click orange bio button
  await naturalClick(page, '#bioBtn');
  await page.waitForSelector('.about-overlay.visible');
  await page.waitForTimeout(1400);

  // Close receipt — direct click so crumple fires immediately
  await page.click('#aboutClose');
  await page.waitForTimeout(800);

  // Click blue links/console button
  await naturalClick(page, '#linksBtn');
  await page.waitForSelector('.dock-wrap.visible');
  await page.waitForTimeout(500);

  // Hover each dock item so labels slide in
  await page.hover('a[href*="linkedin"] .dock-btn');
  await page.waitForTimeout(900);

  await page.hover('#expLink .dock-btn');
  await page.waitForTimeout(900);

  await page.hover('a[href*="substack"] .dock-btn');
  await page.waitForTimeout(900);

  // Move cursor away briefly to reset hover state, then re-hover Experience
  await page.mouse.move(640, 400);
  await page.waitForTimeout(300);

  // Re-capture Experience position fresh (labels may have shifted layout)
  await page.hover('#expLink .dock-btn');
  await page.waitForTimeout(500);

  await page.mouse.down();
  await page.waitForTimeout(140);
  await page.mouse.up();
  await page.waitForURL('**/experience.html');
  await page.waitForTimeout(1200);

  // Go back — dock reappears via #links hash
  await page.goBack();
  await page.waitForSelector('.dock-wrap.visible', { timeout: 5000 });
  await page.waitForTimeout(600);

  // Close dock — pill slides back in
  await naturalClick(page, '#dockBack');
  await page.waitForSelector('#pill:not(.hidden)');
  await page.waitForTimeout(600);

  // Collapse pill back to just the M dot
  await naturalClick(page, '#avatar');
  await page.waitForTimeout(900);

  await context.close();
  await browser.close();

  const files = fs.readdirSync(videosDir)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({ name: f, time: fs.statSync(path.join(videosDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  console.log(`\nVideo saved: videos/${files[0].name}`);
})();
