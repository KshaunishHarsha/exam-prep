// Renders the PWA icons (📚 on the accent blue) with Playwright's Chromium. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test'

const targets = [
  ['icon-192.png', 192, 0.56],
  ['icon-512.png', 512, 0.56],
  ['icon-maskable-512.png', 512, 0.42], // extra padding keeps the emoji inside the maskable safe zone
  ['apple-touch-icon.png', 180, 0.56],
]

const browser = await chromium.launch()
for (const [file, size, scale] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:linear-gradient(160deg,#2f8cff,#0062cc);font-size:${Math.round(size * scale)}px;line-height:1">📚</body>`)
  await page.screenshot({ path: `public/icons/${file}` })
  await page.close()
}
await browser.close()
