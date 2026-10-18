const OWNER = '11111111-1111-4111-8111-111111111111';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
async function mockSocial(page, options = {}) {
  const state = {
    profile: { user_id: OWNER, avatar_url: null, banner_url: null },
    posts: Array.from({ length: 6 }, (_, i) => ({
      id: `44444444-4444-4444-8444-${String(i + 1).padStart(12, '0')}`,
      user_id: OWNER,
      content: `Server post ${i + 1}`,
      media_url: null,
      media_type: null,
      created_at: new Date(Date.UTC(2026, 9, 17, 12, 0, 6 - i)).toISOString(),
      archived_at: null,
      deletion_started_at: null,
      pin_slot: null,
      likes_count: 0,
      comments_count: 0,
    })),
    requests: [],
    objects: new Map(),
    following: options.following ?? 0,
    followers: options.followers ?? 0,
    likes: [],
    bookmarks: [],
    reports: [],
    comments: [],
    blocks: [],
    follows: options.connections ?? [],
    people: options.people ?? [],
    failActions: false,
    failCleanup: false,
    denyMedia: false,
  };
  let socket, channelTopic;
  await page.routeWebSocket('**/realtime/v1/**', (ws) => {
    socket = ws;
    ws.onMessage((message) => {
      const [joinRef, ref, topic, event] = JSON.parse(String(message));
      if (event === 'phx_join') channelTopic = topic;
      if (event === 'phx_join' || event === 'heartbeat' || event === 'phx_leave')
        ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]));
    });
  });
  state.broadcastFollows = () => {
    if (!socket || !channelTopic) throw Error('No private follow channel connected');
    socket.send(
      JSON.stringify([
        null,
        null,
        channelTopic,
        'broadcast',
        { event: 'changed', payload: {}, type: 'broadcast' },
      ]),
    );
  };
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    const payload = ['POST', 'PATCH'].includes(method) ? request.postDataJSON() : undefined;
    state.requests.push({ table: url.pathname.split('/').at(-1), method, payload, url: url.pathname });
    if (url.pathname.endsWith('/kampusx_follow_requests_version'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.followSetupMissing ? null : '20261018190000'),
      });
    if (url.pathname.endsWith('/follows')) {
      const matches = (row) =>
        [...url.searchParams].every(([key, filter]) => {
          if (!['follower_id', 'following_id', 'status'].includes(key)) return true;
          return filter.startsWith('eq.')
            ? row[key] === filter.slice(3)
            : filter.startsWith('in.(')
              ? filter.slice(4, -1).split(',').includes(row[key])
              : true;
        });
      let rows = state.follows.filter(matches);
      if (options.failFollows || (options.failFollowWrites && method !== 'GET' && method !== 'HEAD'))
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ code: '42501', message: 'Denied' }),
        });
      if (method === 'POST') {
        if (
          state.follows.some(
            (r) => r.follower_id === payload.follower_id && r.following_id === payload.following_id,
          )
        )
          return route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ code: '23505', message: 'Duplicate' }),
          });
        const peer = state.people.find((p) => p.user_id === payload.following_id);
        state.follows.push({
          ...payload,
          status: peer?.is_private === false ? 'accepted' : 'pending',
          created_at: new Date().toISOString(),
        });
      } else if (method === 'PATCH') rows.forEach((row) => Object.assign(row, payload));
      else if (method === 'DELETE') state.follows = state.follows.filter((r) => !matches(r));
      const count = options.connections
        ? rows.length
        : url.searchParams.get('status') === 'eq.pending'
          ? 0
          : url.searchParams.has('follower_id')
            ? state.following
            : state.followers;
      const offset = Number(url.searchParams.get('offset') || 0),
        limit = Number(url.searchParams.get('limit') || 30);
      rows = rows.slice(offset, offset + limit);
      return route.fulfill({
        status: options.failFollows ? 403 : 200,
        contentType: 'application/json',
        headers: {
          'access-control-allow-origin': '*',
          'access-control-expose-headers': 'content-range',
          'content-range': `*/${count}`,
        },
        body: method === 'HEAD' ? '' : JSON.stringify(rows),
      });
    }
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
    const table = url.pathname.split('/').at(-1),
      value = (key) => url.searchParams.get(key)?.replace(/^eq\./, '');
    const visible = (post) => !state.blocks.some((b) => b.blocked_id === post.user_id);
    const fail = (message = 'post_unavailable', code = '42501') =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code, message }),
      });
    if (table.startsWith('kampusx_')) {
      if (state.failActions) return fail();
      const p = state.posts.find((p) => p.id === payload.p_post_id);
      const snapshot = () =>
        p
          ? {
              ...p,
              liked: state.likes.some((l) => l.post_id === p.id),
              bookmarked: state.bookmarks.some((l) => l.post_id === p.id),
            }
          : null;
      if (table === 'kampusx_post_state') body = snapshot();
      else if (table === 'kampusx_set_reaction') {
        if (!p || !visible(p) || p.archived_at || p.deletion_started_at) return fail();
        const rows = payload.p_kind === 'like' ? state.likes : state.bookmarks,
          index = rows.findIndex((l) => l.post_id === p.id);
        if (payload.p_enabled && index < 0)
          rows.push({ post_id: p.id, user_id: OWNER, created_at: new Date().toISOString() });
        if (!payload.p_enabled && index >= 0) rows.splice(index, 1);
        p.likes_count = state.likes.filter((l) => l.post_id === p.id).length;
        body = snapshot();
      } else if (table === 'kampusx_pin_post') {
        if (!p || p.user_id !== OWNER) return fail();
        const used = state.posts.filter((p) => p.user_id === OWNER && p.pin_slot).map((p) => p.pin_slot);
        if (payload.p_pinned && !p.pin_slot && used.length >= 3) return fail('pin_limit', 'P0001');
        p.pin_slot = payload.p_pinned ? (p.pin_slot ?? [1, 2, 3].find((s) => !used.includes(s))) : null;
        body = { pin_slot: p.pin_slot };
      } else if (table === 'kampusx_archive_post') {
        if (!p || p.user_id !== OWNER) return fail();
        p.archived_at = payload.p_archived ? new Date().toISOString() : null;
        if (p.archived_at) p.pin_slot = null;
        body = { archived_at: p.archived_at, pin_slot: p.pin_slot };
      } else if (table === 'kampusx_begin_post_delete') {
        if (!p) body = { missing: true };
        else {
          if (p.user_id !== OWNER) return fail();
          p.deletion_started_at = new Date().toISOString();
          p.pin_slot = null;
          body = {
            post_id: p.id,
            user_id: p.user_id,
            missing: false,
            media_path: p.media_url?.split('/uploads/')[1] ?? null,
          };
        }
      } else if (table === 'kampusx_finish_post_delete') {
        if (p?.media_url && state.objects.has('uploads/' + p.media_url.split('/uploads/')[1]))
          return fail('media_cleanup_required');
        state.posts = state.posts.filter((p) => p.id !== payload.p_post_id);
        body = null;
      } else if (table === 'kampusx_report_post') {
        body = !state.reports.some((r) => r.post_id === p.id);
        if (body) state.reports.push({ post_id: p.id, user_id: OWNER, reason: payload.p_reason });
      } else if (table === 'kampusx_add_comment') {
        if (!p || !visible(p) || p.archived_at) return fail();
        body = state.comments.find((c) => c.id === payload.p_id);
        if (!body) {
          body = {
            id: payload.p_id,
            post_id: p.id,
            user_id: OWNER,
            parent_id: payload.p_parent_id,
            content: payload.p_content,
            created_at: new Date().toISOString(),
          };
          state.comments.push(body);
          p.comments_count++;
        }
      } else return route.fallback();
    } else if (
      ['post_likes', 'post_bookmarks', 'post_reports', 'post_comments', 'user_blocks'].includes(table)
    ) {
      if (state.failActions && method !== 'GET') return fail();
      const names = {
          post_likes: 'likes',
          post_bookmarks: 'bookmarks',
          post_reports: 'reports',
          post_comments: 'comments',
          user_blocks: 'blocks',
        },
        rows = state[names[table]];
      if (table === 'user_blocks' && method === 'POST') {
        if (!rows.some((b) => b.blocked_id === payload.blocked_id))
          rows.push({ ...payload, created_at: new Date().toISOString() });
        state.following = 0;
        state.followers = 0;
        body = null;
      } else if (table === 'user_blocks' && method === 'DELETE') {
        state.blocks = rows.filter((b) => b.blocked_id !== value('blocked_id'));
        body = null;
      } else if (table === 'post_bookmarks' && url.searchParams.get('select')?.includes('posts!inner'))
        body = rows.flatMap((b) => {
          const p = state.posts.find((p) => p.id === b.post_id);
          return p && visible(p) && !p.archived_at && !p.deletion_started_at ? [{ post: p }] : [];
        });
      else
        body = rows.filter((r) => {
          const filter = url.searchParams.get('post_id');
          return (
            !filter ||
            filter === 'eq.' + r.post_id ||
            (filter.startsWith('in.(') && filter.slice(4, -1).split(',').includes(r.post_id))
          );
        });
    } else if (url.pathname.endsWith('/profiles')) {
      if (method !== 'GET') state.profile = { ...state.profile, ...payload };
      const peers = [state.profile, ...state.people];
      const visibleProfiles = peers.filter((p) =>
        [...url.searchParams].every(([key, filter]) => {
          if (!['user_id', 'username'].includes(key)) return true;
          return filter.startsWith('eq.')
            ? p[key] === filter.slice(3)
            : filter.startsWith('neq.')
              ? p[key] !== filter.slice(4)
              : filter.startsWith('in.(')
                ? filter.slice(4, -1).split(',').includes(p[key])
                : true;
        }),
      );
      body = method === 'GET' ? visibleProfiles : state.profile;
    } else if (url.pathname.endsWith('/posts')) {
      if (method === 'POST') {
        const post = {
          id: require('node:crypto').randomUUID(),
          archived_at: null,
          deletion_started_at: null,
          pin_slot: null,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          ...payload,
        };
        state.posts.unshift(post);
        body = post;
      } else
        body = state.posts
          .filter(
            (post) =>
              visible(post) &&
              (!url.searchParams.has('user_id') ||
                url.searchParams.get('user_id') === `eq.${post.user_id}`) &&
              (!value('id') || value('id') === post.id) &&
              (!url.searchParams.has('archived_at') || !post.archived_at) &&
              (!url.searchParams.has('deletion_started_at') || !post.deletion_started_at) &&
              (!url.searchParams.has('or') || post.archived_at || post.deletion_started_at) &&
              (!url.searchParams.has('content') ||
                post.content.toLowerCase().includes(
                  url.searchParams
                    .get('content')
                    .replace(/^ilike\.%|%$/g, '')
                    .toLowerCase(),
                )),
          )
          .sort((a, b) =>
            url.searchParams.get('order')?.startsWith('pin_slot') ? (a.pin_slot ?? 9) - (b.pin_slot ?? 9) : 0,
          );
    } else return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'content-range': `0-${Math.max(0, state.posts.length - 1)}/${state.posts.length}` },
      body: JSON.stringify(body),
    });
  });
  await page.route('**/storage/v1/**', async (route) => {
    const request = route.request();
    state.requests.push({ storage: true, method: request.method(), url: new URL(request.url()).pathname });
    if (options.failStorage && request.method() === 'POST')
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized', message: 'Policy rejected', statusCode: '403' }),
      });
    const path = new URL(request.url()).pathname.replace(/^\/storage\/v1\/object\/(?:public\/)?/, '');
    if (request.method() === 'GET') {
      if (state.denyMedia)
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Access denied' }),
        });
      const object = state.objects.get(path);
      return route.fulfill({
        status: 200,
        contentType: object?.type ?? 'image/png',
        body: object?.bytes ?? PNG,
      });
    }
    if (request.method() === 'DELETE') {
      if (state.failCleanup)
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Access denied' }),
        });
      for (const prefix of request.postDataJSON().prefixes ?? []) state.objects.delete('uploads/' + prefix);
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (request.method() === 'POST') {
      const type = request.headers()['content-type'] || '';
      if (type.startsWith('multipart/form-data')) {
        const form = await new Request('https://local-test.invalid', {
          method: 'POST',
          headers: { 'content-type': type },
          body: request.postDataBuffer(),
        }).formData();
        const file = [...form.values()].find((value) => typeof value !== 'string');
        if (file) state.objects.set(path, { type: file.type, bytes: Buffer.from(await file.arrayBuffer()) });
      } else state.objects.set(path, { type, bytes: request.postDataBuffer() });
    }
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
