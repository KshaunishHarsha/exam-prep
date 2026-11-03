import { expect, test } from '@playwright/test'

// Nov 9 has two tasks, so ticking one doesn't complete (and collapse) the day.
const task = { name: /Business Statistics — Day 1/ }

test('a checked task stays checked after reload', async ({ page }) => {
  await page.goto('/')
  const box = page.getByRole('checkbox', task)
  await expect(box).not.toBeChecked()
  await box.check({ force: true })
  await expect(box).toBeChecked()
  await expect(page.getByText('1 of 52')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('checkbox', task)).toBeChecked()
  await expect(page.getByText('1 of 52')).toBeVisible()
})
