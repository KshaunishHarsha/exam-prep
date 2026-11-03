import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const scheme of ['light', 'dark'] as const) {
  for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1280, 900]] as const) {
    test(`no axe violations and no horizontal scroll: ${scheme} ${name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height } })
      const page = await ctx.newPage()
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /Exam Prep Tracker/ })).toBeVisible()
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await ctx.close()
    })
  }
}
