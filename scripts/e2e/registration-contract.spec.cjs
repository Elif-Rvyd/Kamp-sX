const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { mockSocial } = require('./mock-social.cjs');
const U = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  V = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
async function setup(page, lang, theme, options = {}) {
  const state = await mockSocial(page, options);
  await page.addInitScript(
    ({ lang, theme }) => {
      localStorage.setItem('kampusx-language', lang);
      localStorage.setItem('kampusx-theme', theme);
    },
    { lang, theme },
  );
  const signup = [];
  await page.route('**/auth/v1/**', (route) => {
    if (route.request().url().includes('/signup')) {
      signup.push(route.request().postDataJSON());
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'unexpected_failure', msg: 'academic_catalog_selection_required' }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/auth/register');
  return { state, signup };
}
async function fill(page) {
  for (const [field, value] of Object.entries({
    name: 'Test Student',
    username: 'new_student',
    email: 'test@uni.edu.tr',
    password: 'LocalTestPassword123!',
  }))
    await page.locator('#register-' + field).fill(value);
  await page.locator('#register-university').selectOption({ label: 'Kırşehir Ahi Evran Üniversitesi' });
  await page.locator('#register-campus').selectOption({ label: 'Cacabey Yerleşkesi' });
  await page.locator('#register-department').selectOption({ label: 'Bilgisayar Programcılığı' });
}
for (const [lang, theme] of [
  ['tr', 'dark'],
  ['en', 'light'],
])
  test(`registration native dependent selections, acceptance and legal ${lang}/${theme}`, async ({
    page,
  }) => {
    const { state, signup } = await setup(page, lang, theme);
    await fill(page);
    await expect(page.locator('#register-university')).toHaveJSProperty('tagName', 'SELECT');
    await page.locator('#register-university').selectOption({ label: 'İstanbul Teknik Üniversitesi' });
    await expect(page.locator('#register-campus')).toHaveValue('');
    await expect(page.locator('#register-department')).toHaveValue('');
    await expect(page.locator('#register-campus option')).toHaveText([
      lang === 'tr' ? 'Seçiniz' : 'Select an option',
      'Ayazağa Kampüsü',
    ]);
    await page.locator('#register-campus').selectOption({ label: 'Ayazağa Kampüsü' });
    await page.locator('#register-department').selectOption({ label: 'Bilgisayar Mühendisliği' });
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page.locator('#register-consent')).toBeFocused();
    expect(signup).toHaveLength(0);
    await page.locator('.legal-links button').first().click();
    await expect(page.getByRole('dialog')).toContainText('Elif Rüveyda Ulama');
    await expect(page.getByRole('dialog')).toContainText('elifrvyd@protonmail.com');
    await page.keyboard.press('Escape');
    await expect(page.locator('.legal-links button').first()).toBeFocused();
    await page.locator('.legal-links button').last().click();
    await expect(page.getByRole('dialog')).toContainText(
      lang === 'tr' ? 'uçtan uca şifreli değildir' : 'not end-to-end encrypted',
    );
    await page.keyboard.press('Escape');
    await page.locator('#register-consent').check();
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page.getByRole('alert')).toContainText(
      lang === 'tr' ? 'geçerli seçimler' : 'valid university',
    );
    expect(signup).toHaveLength(1);
    expect(signup[0].data).toMatchObject({
      terms_accepted: true,
      privacy_acknowledged: true,
      terms_version: '2026-10-22',
      campus_name: 'Ayazağa Kampüsü',
    });
    expect(state.requests.some((r) => r.table === 'campuses' && r.filters.university_id === 'eq.' + V)).toBe(
      true,
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: test.info().outputPath('registration-' + lang + '-' + theme + '.png'),
      fullPage: true,
    });
  });
test('taken username never dispatches signup', async ({ page }) => {
  const { signup } = await setup(page, 'en', 'light', { usernameTaken: true });
  await fill(page);
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.getByRole('status').filter({ hasText: 'This username is taken' })).toBeVisible();
  expect(signup).toHaveLength(0);
});
test('large department lists are paged completely; unavailable university has no invented options', async ({
  page,
}) => {
  const { signup } = await setup(page, 'en', 'light', {
    academic: {
      universities: [
        { id: U, name: 'Example University' },
        { id: V, name: 'Empty University' },
      ],
      campuses: [{ id: 'c', university_id: U, name: 'Campus' }],
      departments: Array.from({ length: 530 }, (_, i) => ({
        id: 'd' + i,
        university_id: U,
        name: 'Department ' + i,
      })),
    },
  });
  await page.locator('#register-university').selectOption({ label: 'Example University' });
  await expect(page.locator('#register-department option')).toHaveCount(531);
  await page.locator('#register-department').selectOption({ label: 'Department 529' });
  await page.locator('#register-university').selectOption({ label: 'Empty University' });
  await expect(page.locator('#register-campus option')).toHaveCount(1);
  await expect(page.locator('#register-department')).toHaveValue('');
  expect(signup).toEqual([]);
});
