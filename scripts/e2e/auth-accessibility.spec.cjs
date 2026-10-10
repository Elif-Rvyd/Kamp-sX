const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test('auth modes retain accessible labels, unique IDs, and error associations', async ({ page }) => {
  test.setTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const mode of ['login', 'register', 'forgot-password']) {
    for (const language of ['tr', 'en']) {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          ({ theme, language }) => {
            localStorage.setItem('kampusx-language', language);
            localStorage.setItem('kampusx-theme', theme);
          },
          { theme, language },
        );
        await page.setViewportSize({ width: language === 'en' ? 320 : 390, height: 844 });
        await page.goto('/auth/' + mode);
        await expect(page.locator('html')).toHaveAttribute('lang', language);
        await expect(page.locator('html')).toHaveClass(theme === 'dark' ? 'dark' : '');
        const panel = page.locator('#auth-panel');
        const firstInput = panel.locator('input').first();
        await panel.locator('label').first().click();
        await expect(firstInput).toBeFocused();
        await panel.locator('button[type=submit]').click();
        await expect(firstInput).toBeFocused();
        await expect(firstInput).toHaveAttribute('aria-invalid', 'true');
        const duplicateIds = await page.evaluate(() => {
          const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
          return ids.filter((id, i) => ids.indexOf(id) !== i);
        });
        expect(duplicateIds).toEqual([]);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
        ).toBe(true);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
          [],
        );
        // Full-page captures start at the top so sticky chrome is not rendered mid-document.
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({
          path: test.info().outputPath(`auth-${mode}-${theme}-${language}.png`),
          fullPage: true,
        });
      }
    }
  }
  expect(errors).toEqual([]);
});
