import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Wait for Three.js to fully render
await page.waitForTimeout(4000);

// Screenshot 1: Full globe view
console.log('Taking screenshot 1: globe');
await page.screenshot({ path: 'screenshot-1-globe.png', fullPage: false });

// Open a tool via JavaScript
console.log('Opening tool 0 (calculator)...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 0) labels[0].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-2-popup.png', fullPage: false });
console.log('Screenshot 2 taken (popup)');

// Close
await page.evaluate(() => {
  document.getElementById('popup-close').click();
});
await page.waitForTimeout(1000);
console.log('Popup closed');

// Open another tool (calendar - index 4)
console.log('Opening tool 4 (calendar)...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 4) labels[4].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-3-calendar.png', fullPage: false });
console.log('Screenshot 3 taken (calendar)');

// Open drawing tool
await page.evaluate(() => {
  document.getElementById('popup-close').click();
});
await page.waitForTimeout(1000);
console.log('Opening tool 8 (drawing)...');
await page.evaluate(() => {
  const labels = document.querySelectorAll('.tool-label');
  if (labels.length > 8) labels[8].click();
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'screenshot-4-drawing.png', fullPage: false });
console.log('Screenshot 4 taken (drawing)');

await browser.close();
console.log('All screenshots saved!');
