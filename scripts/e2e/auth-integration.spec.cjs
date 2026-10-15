const { mockSocial } = require('./mock-social.cjs');
const { test, expect } = require('@playwright/test');

const email = 'student@itu.edu.tr';
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: '2026-01-01T00:00:00Z',
  confirmed_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { username: 'student' },
  identities: [],
};

function sessionResponse() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: expiresAt,
  })}.fake_signature_for_local_test`;
  return {
    access_token: accessToken,
    refresh_token: 'fake_refresh_token_for_local_test',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
}

async function mockAuth(page, handlers = {}) {
  const requests = [];
  await mockSocial(page);
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const operation = url.pathname.split('/auth/v1/')[1];
    const body = request.postDataJSON();
    requests.push({ operation, method: request.method(), body, url });
    const handler = handlers[operation];
    const response = handler
      ? await handler({ request, body, url })
      : operation === 'user'
        ? { status: 200, body: user }
        : operation === 'logout'
          ? { status: 204 }
          : { status: 400, body: { code: 'unexpected_failure', msg: 'UNEXPECTED_TEST_REQUEST' } };
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'x-supabase-api-version',
        'x-supabase-api-version': '2024-01-01',
      },
      body: response.body === undefined ? '' : JSON.stringify(response.body),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem('kampusx-language', 'tr');
    localStorage.setItem('kampusx-theme', 'light');
  });
  return requests;
}

async function mockLoginLookup(page, handler = () => ({ status: 200, body: true })) {
  const requests = [];
  await page.route('**/rest/v1/rpc/kampusx_login_email_exists', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const body = route.request().postDataJSON();
    requests.push(body);
    const response = await handler(body);
    await route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(response.body),
    });
  });
  return requests;
}

for (const remember of [false, true]) {
  test(`login uses ${remember ? 'persistent' : 'tab-scoped'} session storage`, async ({ page }) => {
    const response = sessionResponse();
    const requests = await mockAuth(page, { token: () => ({ body: response }) });
    await page.goto('/auth/login');
    await page.locator('#login-identity').fill(email);
    await page.locator('#login-password').fill('LocalTestPassword123!');
    const rememberControl = page.locator('input[formcontrolname=remember]');
    await rememberControl.setChecked(remember);
    await page.locator('#auth-panel button[type=submit]').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('.dashboard-page')).toBeVisible();
    const submitted = requests.find(({ operation }) => operation === 'token');
    expect(submitted.body.email).toBe(email);
    expect(submitted.body.password).toBe('LocalTestPassword123!');
    const persisted = await page.evaluate((accessToken) => {
      const containsToken = (storage) =>
        Object.keys(storage).some((key) => (storage.getItem(key) || '').includes(accessToken));
      return { local: containsToken(localStorage), session: containsToken(sessionStorage) };
    }, response.access_token);
    expect(persisted).toEqual({ local: remember, session: !remember });
    await page.reload();
    await expect(page.locator('.dashboard-page')).toBeVisible();
    await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
    await expect(page.getByRole('dialog').getByText('@student', { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Okul bilgisi eklenmemiş')).toBeVisible();
    expect(requests.some(({ operation }) => operation === 'user')).toBe(true);
  });
}

test('invalid credentials display a safe localized error and allow retry', async ({ page }) => {
  const lookups = await mockLoginLookup(page);
  let failed = true;
  const requests = await mockAuth(page, {
    token: () =>
      failed
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.click();
  await expect(page.locator('#auth-panel [role=alert]')).toBeVisible();
  await expect(page.locator('#auth-panel [role=alert]')).toContainText('E-posta veya şifre yanlış');
  await expect(page.locator('#auth-panel')).not.toContainText('PRIVATE_BACKEND_ERROR');
  await expect(submit).toBeEnabled();
  failed = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(requests.filter(({ operation }) => operation === 'token')).toHaveLength(2);
  expect(lookups).toEqual([]);
});

test('an unknown email uses the same generic message in TR and EN and permits retry', async ({ page }) => {
  let missing = true;
  await mockAuth(page, {
    token: () =>
      missing
        ? { status: 400, body: { code: 'invalid_credentials', msg: 'PRIVATE_BACKEND_ERROR' } }
        : { body: sessionResponse() },
  });
  const lookups = await mockLoginLookup(page, () => ({ body: false }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toHaveText('E-posta veya şifre yanlış. Bilgilerini kontrol et.');
  await expect(submit).toBeEnabled();
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toHaveText('The email or password is incorrect. Check your details.');
  expect(lookups).toEqual([]);
  missing = false;
  await submit.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(lookups).toHaveLength(0);
});

test('a disabled or missing legacy RPC does not affect credential error handling', async ({ page }) => {
  await mockAuth(page, {
    token: () => ({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } }),
  });
  const lookups = await mockLoginLookup(page, () => ({
    status: 404,
    body: { code: 'PGRST202', message: 'PRIVATE_SCHEMA_ERROR' },
  }));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  const alert = page.locator('#auth-panel [role=alert]');
  await expect(alert).toHaveText('E-posta veya şifre yanlış. Bilgilerini kontrol et.');
  await expect(alert).not.toContainText('PRIVATE_SCHEMA_ERROR');
  expect(lookups).toHaveLength(0);
  await expect(page.locator('#auth-panel button[type=submit]')).toBeEnabled();
});

test('a slow sign-in keeps submits disabled and reserves generic error feedback on a narrow dark screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let resolveToken,
    tokenStarted = false;
  const response = new Promise((resolve) => (resolveToken = resolve));
  await mockAuth(page, {
    token: () => {
      tokenStarted = true;
      return response;
    },
  });
  const lookups = await mockLoginLookup(page);
  await page.addInitScript(() => localStorage.setItem('kampusx-theme', 'dark'));
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  const submit = page.locator('#auth-panel button[type=submit]');
  await submit.scrollIntoViewIfNeeded();
  const before = await submit.boundingBox();
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.locator('#auth-panel form')).toHaveAttribute('aria-busy', 'true');
  await expect.poll(() => tokenStarted).toBe(true);
  resolveToken({ status: 400, body: { code: 'invalid_credentials', msg: 'Invalid' } });
  await expect(page.locator('#auth-panel [role=alert]')).toHaveText(
    'E-posta veya şifre yanlış. Bilgilerini kontrol et.',
  );
  expect(lookups).toHaveLength(0);
  const after = await submit.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
  await submit.focus();
  await expect(submit).toBeFocused();
  await page.screenshot({ path: test.info().outputPath('login-generic-error-tr-dark.png'), fullPage: true });
});

test('registration sends metadata and displays email-verification guidance', async ({ page }) => {
  const requests = await mockAuth(page, {
    signup: () => ({ body: { ...user, email_confirmed_at: null, confirmed_at: null } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page.locator('#auth-panel .success-message')).toBeVisible();
  await expect(page.locator('#auth-panel .success-message')).toContainText(/e-posta/i);
  const submitted = requests.find(({ operation }) => operation === 'signup');
  expect(submitted.body.email).toBe(email);
  expect(submitted.body.data.username).toBe('student');
  expect(submitted.body.data).not.toHaveProperty('role');
});

test('reset requests do not expose whether an account exists', async ({ page }) => {
  const requests = await mockAuth(page, { recover: () => ({ body: {} }) });
  await page.goto('/auth/forgot-password');
  await page.locator('#reset-email').fill(email);
  await page.locator('#auth-panel button[type=submit]').click();
  const success = page.locator('.reset-success');
  await expect(success).toBeVisible();
  await expect(success).toContainText(/hesap|kayıtlı/i);
  await expect(success).toBeFocused();
  expect(requests.find(({ operation }) => operation === 'recover').body.email).toBe(email);
});

test('registration distinguishes email quota from request limits in Turkish and English', async ({
  page,
}) => {
  let code = 'over_email_send_rate_limit';
  await mockAuth(page, {
    signup: () => ({ status: 429, body: { code, msg: 'PRIVATE_PROVIDER_ERROR' } }),
  });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  const submit = page.locator('#auth-panel button[type=submit]');
  const alert = page.locator('#auth-panel [role=alert]');
  await submit.click();
  await expect(alert).toContainText('E-posta gönderim sınırına ulaşıldı');
  await expect(alert).not.toContainText('PRIVATE_PROVIDER_ERROR');
  await expect(submit).toBeEnabled();
  code = 'over_request_rate_limit';
  await submit.click();
  await expect(alert).toContainText('İstek sınırına ulaşıldı');
  await page.locator('kx-language-switcher button[lang=en]').first().click();
  await expect(alert).toContainText('The request limit was reached');
  code = 'over_email_send_rate_limit';
  await submit.click();
  await expect(alert).toContainText('The email sending limit was reached');
});

test('an anonymous visitor cannot open dashboard', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('#login-identity')).toBeVisible();
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
});

test('a rejected stored token cannot open dashboard or reveal profile content', async ({ page }) => {
  const session = sessionResponse();
  await mockAuth(page, { user: () => ({ status: 401, body: { code: 'bad_jwt', msg: 'Invalid token' } }) });
  await page.addInitScript((session) => {
    sessionStorage.setItem('sb-auth-auth-token', JSON.stringify(session));
  }, session);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.locator('.dashboard-page')).toHaveCount(0);
  await expect(page.getByText('@student', { exact: true })).toHaveCount(0);
});

test('sign-out clears the session and denies dashboard until the next login', async ({ page }) => {
  const requests = await mockAuth(page, { token: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/login');
  await page.locator('#login-identity').fill(email);
  await page.locator('#login-password').fill('LocalTestPassword123!');
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/auth/login');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await page.getByRole('button', { name: 'Çıkış yap', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(requests.filter(({ operation }) => operation === 'logout')).toHaveLength(1);
  const remains = await page.evaluate(() =>
    [localStorage, sessionStorage].some((storage) => !!storage.getItem('sb-auth-auth-token')),
  );
  expect(remains).toBe(false);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test('registration opens dashboard only when Supabase returns a session', async ({ page }) => {
  await mockAuth(page, { signup: () => ({ body: sessionResponse() }) });
  await page.goto('/auth/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-username').fill('student');
  await page.locator('#register-university').fill('Kırşehir Ahi Evran Üniversitesi');
  await page.locator('#register-department').fill('Bilgisayar Programcılığı');
  await page.locator('#register-password').fill('LocalTestPassword123!');
  await page.locator('#register-consent').check();
  await page.locator('#auth-panel button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
