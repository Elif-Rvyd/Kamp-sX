const { mockSocial } = require('./mock-social.cjs');
const { expect } = require('@playwright/test');
async function openSocial(
  page,
  language = 'tr',
  theme = 'light',
  url = '/profile',
  width = 390,
  options = {},
) {
  await page.setViewportSize({ width, height: 900 });
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'elif@university.edu.tr',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {
      username: 'elif',
      full_name: 'Elif Yılmaz',
      university_name: 'Kırşehir Ahi Evran Üniversitesi',
      faculty_name: 'Teknik Bilimler Meslek Yüksekokulu',
      department_name: 'Bilgisayar Programcılığı',
    },
    identities: [],
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token:
      encode({ alg: 'HS256', typ: 'JWT' }) +
      '.' +
      encode({ sub: user.id, aud: 'authenticated', exp: expires }) +
      '.local_test_signature',
    refresh_token: 'local_test_refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expires,
    user,
  };
  await page.addInitScript(
    ({ language, theme, session }) => {
      localStorage.setItem('kampusx-language', language);
      localStorage.setItem('kampusx-theme', theme);
      sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
    },
    { language, theme, session },
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
  const backend = [];
  page.on('request', (request) => {
    if (/\/rest\/v1\/|\/storage\/v1\/|\/functions\/v1\//.test(request.url())) backend.push(request.url());
  });
  const social = await mockSocial(page, options);
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return social;
}
module.exports = { openSocial };
