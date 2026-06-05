import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

await page.waitForTimeout(4000);

// Screenshot 1: Globe with orbital satellites
console.log('Taking screenshot 1: orbital globe');
await page.screenshot({ path: 'screenshot-1-orbits.png', fullPage: false });

// Open calculator tool
console.log('Opening calculator...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 0) labels[0].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-2-calc.png', fullPage: false });

// Close, open another
await page.evaluate(() => {
  const btn = document.querySelector('.popup-close-btn');
  if (btn) btn.click();
});
await page.waitForTimeout(1000);

// Open clock tool (index 7)
console.log('Opening clock...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 7) labels[7].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-3-clock.png', fullPage: false });

// Close, open drawing
await page.evaluate(() => {
  const btn = document.querySelector('.popup-close-btn');
  if (btn) btn.click();
});
await page.waitForTimeout(1000);

console.log('Opening drawing...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 8) labels[8].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-4-draw.png', fullPage: false });

await browser.close();
console.log('All screenshots saved!');
