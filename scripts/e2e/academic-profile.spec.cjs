const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`academic details persist after reload and update the drawer ${language}/${theme}`, async ({
      page,
    }) => {
      const state = await openSocial(page, language, theme, '/profile/edit');
      await page.locator('#profile-university').fill('İstanbul Teknik Üniversitesi');
      await page.locator('#profile-department').fill('Bilgisayar Mühendisliği');
      await page.getByRole('button', { name: language === 'tr' ? 'Kaydet' : 'Save', exact: true }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.locator('kx-profile-header')).toContainText('İstanbul Teknik Üniversitesi');
      await expect(page.locator('kx-profile-header')).toContainText('Bilgisayar Mühendisliği');
      expect(state.authRequests.map((request) => request.data)).toEqual([
        {
          full_name: 'Elif Yılmaz',
          bio: '',
          university_name: 'İstanbul Teknik Üniversitesi',
          department_name: 'Bilgisayar Mühendisliği',
        },
      ]);
      expect(state.requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toHaveLength(0);
      await page.reload();
      await expect(page.locator('kx-profile-header')).toContainText('İstanbul Teknik Üniversitesi');
      await page
        .getByRole('button', { name: language === 'tr' ? 'Ana sayfaya dön' : 'Back to home' })
        .click();
      await page
        .getByRole('button', { name: language === 'tr' ? 'Profil menüsünü aç' : 'Open profile menu' })
        .click();
      await expect(page.getByRole('dialog')).toContainText('İstanbul Teknik Üniversitesi');
      await expect(page.getByRole('dialog')).toContainText('Bilgisayar Mühendisliği');
    });
  }
test('academic save errors preserve edits and never show a success toast', async ({ page }) => {
  const state = await openSocial(page, 'tr', 'light', '/profile/edit', 390, { failAcademic: true });
  await page.locator('#profile-university').fill('Yeni Üniversite');
  await page.locator('#profile-department').fill('Yeni Bölüm');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page.locator('.save-error')).toContainText('Profil bilgilerin kaydedilemedi');
  await expect(page.locator('#profile-university')).toHaveValue('Yeni Üniversite');
  await expect(page.locator('#profile-department')).toHaveValue('Yeni Bölüm');
  await expect(page).toHaveURL(/\/profile\/edit$/);
  await expect(page.locator('kx-toast')).toHaveCount(0);
  expect(state.authRequests).toHaveLength(1);
});
