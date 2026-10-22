const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const items = Array.from({ length: 6 }, (_, i) => ({
  title: `World news headline ${i + 1} <script>literal text</script>`,
  source: 'Publisher ' + (i + 1),
  url: 'https://www.euronews.com/2026/10/22/test-' + i,
  publishedAt: new Date(Date.now() - 60000 * i).toISOString(),
}));
for (const [lang, theme, width] of [
  ['tr', 'light', 1440],
  ['en', 'dark', 1440],
  ['tr', 'light', 1088],
  ['tr', 'dark', 390],
  ['en', 'light', 320],
]) {
  test(`world news responsive links and disclosure ${lang}/${theme}/${width}`, async ({ page }, info) => {
    const state = await openSocial(page, lang, theme, '/dashboard', width, { news: { items } });
    const panel = page.locator('kx-world-news'),
      toggle = panel.locator('.news-toggle');
    if (width < 1024) {
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(state.news.requests).toHaveLength(0);
      await toggle.focus();
      await toggle.press('Enter');
    }
    await expect(panel.locator('.news-list a')).toHaveCount(4);
    await expect(panel.locator('.news-list a').first()).toHaveAttribute('target', '_blank');
    await expect(panel.locator('.news-list a').first()).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(panel.locator('script')).toHaveCount(0);
    await panel
      .getByRole('button', { name: lang === 'tr' ? 'Daha fazla göster' : 'Show more', exact: true })
      .click();
    await expect(panel.locator('.news-list a')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width >= 1024) {
      const feed = await page.locator('.discover-viewport').boundingBox(),
        news = await panel.boundingBox();
      expect(news.x).toBeGreaterThan(feed.x + feed.width - 1);
    }
    expect((await new AxeBuilder({ page }).include('kx-world-news').analyze()).violations).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`world-news-${lang}-${theme}-${width}.png`),
      fullPage: false,
    });
  });
}
test('news failure retries without touching the feed; locale and stale states stay truthful', async ({
  page,
}) => {
  const state = await openSocial(page, 'tr', 'light', '/dashboard', 1440, { news: { failed: true } }),
    panel = page.locator('kx-world-news');
  await expect(panel.getByText('Haberlere şu anda ulaşılamıyor. Yeniden deneyebilirsin.')).toBeVisible();
  state.news.failed = false;
  state.news.items = items;
  await panel.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await expect(panel.locator('.news-list a')).toHaveCount(4);
  state.news.stale = true;
  await panel.getByRole('button', { name: 'Haberleri yenile', exact: true }).click();
  await expect(panel.getByText('Haberler yenilenemedi. Son alınan başlıklar gösteriliyor.')).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'What’s happening worldwide?' })).toBeVisible();
  await expect.poll(() => state.news.requests.at(-1)).toBe('en');
  await expect(panel.locator('.news-list a')).toHaveCount(4);
  await expect(page.getByRole('tab', { name: 'Explore', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
