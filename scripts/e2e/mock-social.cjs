const OWNER = '11111111-1111-4111-8111-111111111111';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
async function mockSocial(page, options = {}) {
  const state = {
    profile: { user_id: OWNER, avatar_url: null, banner_url: null },
    posts: Array.from({ length: 6 }, (_, i) => ({
      id: `post-${i}`,
      user_id: OWNER,
      content: `Server post ${i + 1}`,
      media_url: null,
      media_type: null,
    })),
    requests: [],
  };
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    const payload = ['POST', 'PATCH'].includes(method) ? request.postDataJSON() : undefined;
    state.requests.push({ table: url.pathname.split('/').at(-1), method, payload, url: url.pathname });
    if (options.failProfileRead && method === 'GET' && url.pathname.endsWith('/profiles'))
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unavailable' }),
      });
    if ((options.failDatabase || options.uncertainDatabase) && method !== 'GET')
      return route.fulfill({
        status: options.uncertainDatabase ? 503 : 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: '42501', message: 'Policy rejected' }),
      });
    let body;
    if (url.pathname.endsWith('/profiles')) {
      if (method !== 'GET') state.profile = { ...state.profile, ...payload };
      body = method === 'GET' ? [state.profile] : state.profile;
    } else if (url.pathname.endsWith('/posts')) {
      if (method === 'POST') {
        const post = { id: `created-${state.posts.length}`, ...payload };
        state.posts.unshift(post);
        body = post;
      } else
        body = state.posts.filter(
          (post) =>
            !url.searchParams.has('user_id') || url.searchParams.get('user_id') === `eq.${post.user_id}`,
        );
    } else return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${Math.max(0, state.posts.length - 1)}/${state.posts.length}` },
      body: JSON.stringify(body),
    });
  });
  await page.route('**/storage/v1/**', (route) => {
    const request = route.request();
    state.requests.push({ storage: true, method: request.method(), url: new URL(request.url()).pathname });
    if (options.failStorage && request.method() === 'POST')
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized', message: 'Policy rejected', statusCode: '403' }),
      });
    if (request.method() === 'GET')
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        Id: 'test-object',
        Key: new URL(request.url()).pathname.replace('/storage/v1/object/', ''),
      }),
    });
  });
  return state;
}
module.exports = { mockSocial, OWNER };
