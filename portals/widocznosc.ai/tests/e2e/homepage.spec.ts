import { test, expect } from '@playwright/test';

test('homepage renders with hero, header, footer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main h1')).toContainText('Bądź widoczny');
  await expect(page.locator('footer')).toContainText('ICEA');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('navigation: homepage → autorzy → tomasz-czechowski', async ({ page }) => {
  await page.goto('/');
  await page.click('text=O nas');
  await expect(page).toHaveURL(/\/o-nas\//);
  await page.goto('/autorzy/');
  await page.click('text=Tomasz Czechowski');
  await expect(page).toHaveURL(/\/autor\/tomasz-czechowski\//);
  await expect(page.locator('main h1')).toContainText('Tomasz Czechowski');
});
