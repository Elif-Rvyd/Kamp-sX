const OWNER = '11111111-1111-4111-8111-111111111111';
const { postColumns } = require('../fixtures/post-schema.cjs');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
async function mockSocial(page, options = {}) {
  const state = {
    profile: {
      user_id: OWNER,
      username: 'elif',
      full_name: 'Elif Yılmaz',
      bio: '',
      avatar_url: null,
      banner_url: null,
      university: 'Kırşehir Ahi Evran Üniversitesi',
      campus: 'Teknik Bilimler Meslek Yüksekokulu',
      studying: 'Bilgisayar Programcılığı',
      created_at: '2026-01-01T00:00:00Z',
      is_private: true,
      visible_department: false,
      visible_campus: false,
      visible_university: false,
      visible_explore: false,
      audience_configured: false,
    },
    posts: Array.from({ length: 6 }, (_, i) => ({
      id: `44444444-4444-4444-8444-${String(i + 1).padStart(12, '0')}`,
      user_id: OWNER,
      content: `Server post ${i + 1}`,
      media_url: null,
      media_type: null,
      created_at: new Date(Date.UTC(2026, 9, 17, 12, 0, 6 - i)).toISOString(),
      archived_at: null,
      deleted_at: null,
      pinned_at: null,
      parent_id: null,
      repost_of_id: null,
      replies_count: 0,
      reposts_count: 0,
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
  Object.assign(state.profile, options.profile ?? {});
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
    state.requests.push({
      table: url.pathname.split('/').at(-1),
      method,
      payload,
      url: url.pathname,
      select: url.searchParams.get('select'),
      filters: Object.fromEntries(url.searchParams),
    });
    if (url.pathname.endsWith('/kampusx_follow_requests_version'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.followSetupMissing ? null : '20261018190000'),
      });
    if (url.pathname.endsWith('/kampusx_reply_contract_version'))
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.replySetupMissing ? null : '2026102102'),
      });
    if (
      url.pathname.endsWith('/kampusx_owner_actions_version') ||
      url.pathname.endsWith('/kampusx_account_contract_version')
    )
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          (
            url.pathname.endsWith('/kampusx_owner_actions_version')
              ? options.ownerSetupMissing
              : options.accountSetupMissing
          )
            ? null
            : '2026102201',
        ),
      });
    if (url.pathname.endsWith('/kampusx_soft_delete_post')) {
      const post = state.posts.find((p) => p.id === payload.p_post_id && p.user_id === OWNER);
      if (!post || state.failActions)
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ code: '42501', message: 'post_unavailable' }),
        });
      post.deleted_at = new Date().toISOString();
      post.pinned_at = null;
      return route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
    }
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
    if (table === 'posts') {
      const references = [
        ...(url.searchParams
          .get('select')
          ?.replace(/,profiles!inner\([^)]*\)/, '')
          .split(',') ?? []),
        ...[...url.searchParams.keys()].filter(
          (key) =>
            !['select', 'order', 'limit', 'offset', 'or', 'and'].includes(key) &&
            !key.startsWith('profiles.'),
        ),
        ...(url.searchParams
          .get('order')
          ?.split(',')
          .map((field) => field.split('.')[0]) ?? []),
        ...(url.searchParams
          .get('or')
          ?.replace(/[()]/g, '')
          .split(',')
          .map((field) => field.split('.')[0]) ?? []),
        ...Object.keys(payload ?? {}),
      ];
      if (references.some((column) => !postColumns.has(column)))
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: '42703', message: 'Column does not exist' }),
        });
    }
    const visible = (post) => !state.blocks.some((b) => b.blocked_id === post.user_id);
    const fail = (message = 'post_unavailable', code = '42501') =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code, message }),
      });
    if (table === 'reports' || table === 'blocks') {
      if (state.failActions && method !== 'GET') return fail();
      const rows = state[table];
      if (method === 'POST') {
        const duplicate = rows.some((r) =>
          table === 'reports'
            ? r.reporter_id === payload.reporter_id && r.post_id === payload.post_id
            : r.blocker_id === payload.blocker_id && r.blocked_id === payload.blocked_id,
        );
        if (duplicate) return fail('duplicate', '23505');
        rows.push({ ...payload, created_at: new Date().toISOString() });
        if (table === 'blocks') {
          state.follows = state.follows.filter(
            (r) => ![r.follower_id, r.following_id].includes(payload.blocked_id),
          );
          state.following = 0;
        }
      } else if (method === 'DELETE')
        state[table] = rows.filter((r) => r.blocked_id !== value('blocked_id') || r.blocker_id !== OWNER);
      body = method === 'GET' ? state[table] : null;
    } else if (table === 'likes' || table === 'bookmarks') {
      if (state.failActions && method !== 'GET') return fail();
      const matches = (row) =>
        [...url.searchParams].every(([key, filter]) => {
          if (!['user_id', 'post_id'].includes(key)) return true;
          return filter.startsWith('eq.')
            ? row[key] === filter.slice(3)
            : filter.startsWith('in.(')
              ? filter.slice(4, -1).split(',').includes(row[key])
              : true;
        });
      if (method === 'POST') {
        if (
          Object.keys(payload).some((key) => !['user_id', 'post_id'].includes(key)) ||
          payload.user_id !== OWNER
        )
          return fail();
        const post = state.posts.find((p) => p.id === payload.post_id);
        if (!post || !visible(post) || post.deleted_at || post.archived_at) return fail();
        if (state[table].some((r) => r.post_id === payload.post_id && r.user_id === OWNER))
          return fail('duplicate', '23505');
        state[table].push({ ...payload, created_at: new Date().toISOString() });
      } else if (method === 'DELETE') state[table] = state[table].filter((row) => !matches(row));
      state.posts.forEach((p) => (p.likes_count = state.likes.filter((r) => r.post_id === p.id).length));
      let rows = state[table].filter(matches);
      if (table === 'bookmarks' && url.searchParams.get('select')?.includes('posts!inner')) {
        rows = rows.flatMap((r) => {
          const post = state.posts.find((p) => p.id === r.post_id);
          return post && visible(post) && !post.archived_at && !post.deleted_at ? [{ post }] : [];
        });
      }
      body = rows.slice(
        Number(url.searchParams.get('offset') || 0),
        Number(url.searchParams.get('offset') || 0) + Number(url.searchParams.get('limit') || rows.length),
      );
    } else if (table.startsWith('kampusx_')) {
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
        p.pinned_at = payload.p_pinned ? new Date().toISOString() : null;
        body = { pin_slot: p.pin_slot };
      } else if (table === 'kampusx_archive_post') {
        if (!p || p.user_id !== OWNER) return fail();
        p.archived_at = payload.p_archived ? new Date().toISOString() : null;
        if (p.archived_at) p.pin_slot = null;
        if (p.archived_at) p.pinned_at = null;
        body = { archived_at: p.archived_at, pin_slot: p.pin_slot };
      } else if (table === 'kampusx_begin_post_delete') {
        if (!p) body = { missing: true };
        else {
          if (p.user_id !== OWNER) return fail();
          p.deletion_started_at = new Date().toISOString();
          p.pin_slot = null;
          p.pinned_at = null;
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
          p.replies_count++;
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
      if (method === 'PATCH' && options.failAccountSave) return fail();
      if (method !== 'GET')
        state.profile = {
          ...state.profile,
          ...payload,
          ...(method === 'PATCH' && Object.keys(payload).some((k) => k.startsWith('visible_'))
            ? { audience_configured: true }
            : {}),
        };
      const peers = [state.profile, ...state.people];
      const visibleProfiles = peers.filter(
        (p) =>
          (p.user_id === OWNER ||
            !state.blocks.some((b) => b.blocked_id === p.user_id || b.blocker_id === p.user_id)) &&
          [...url.searchParams].every(([key, filter]) => {
            if (!['user_id', 'username', 'full_name'].includes(key)) return true;
            if (filter.startsWith('ilike.')) {
              const literal = filter.slice(7, -1).replace(/\\([\\%_])/g, '$1');
              return String(p[key] ?? '')
                .toLowerCase()
                .includes(literal.toLowerCase());
            }
            return filter.startsWith('eq.')
              ? p[key] === filter.slice(3)
              : filter.startsWith('neq.')
                ? p[key] !== filter.slice(4)
                : filter.startsWith('in.(')
                  ? filter.slice(4, -1).split(',').includes(p[key])
                  : true;
          }),
      );
      body =
        method === 'GET'
          ? visibleProfiles.slice(0, Number(url.searchParams.get('limit') || visibleProfiles.length))
          : state.profile;
      if (request.headers()['accept']?.includes('vnd.pgrst.object')) body = visibleProfiles[0] ?? null;
    } else if (url.pathname.endsWith('/posts')) {
      if (method === 'PATCH') {
        if (state.failActions) return fail();
        const post = state.posts.find((p) => p.id === value('id') && p.user_id === OWNER && !p.deleted_at);
        if (!post) return fail();
        if (Object.keys(payload).some((k) => !['pinned_at', 'archived_at', 'deleted_at'].includes(k)))
          return fail();
        if (
          payload.pinned_at &&
          !post.pinned_at &&
          state.posts.filter((p) => p.pinned_at && !p.deleted_at && !p.archived_at).length >= 3
        )
          return fail('pin_limit', '23514');
        Object.assign(post, payload);
        if (post.archived_at || post.deleted_at) post.pinned_at = null;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/1', 'access-control-expose-headers': 'content-range' },
          body: 'null',
        });
      }
      if (method === 'POST') {
        if (state.failActions) return fail();
        if (
          Object.keys(payload).some(
            (key) =>
              !['user_id', 'content', 'media_url', 'media_type', 'parent_id', 'repost_of_id'].includes(key),
          ) ||
          payload.user_id !== OWNER
        )
          return fail();
        if (payload.parent_id) {
          const parent = state.posts.find((p) => p.id === payload.parent_id);
          if (!parent || !visible(parent) || parent.deleted_at) return fail();
          const ancestor = state.posts.find((p) => p.id === parent.parent_id);
          if (ancestor?.parent_id) return fail('reply_depth_limit', '23514');
        }
        const post = {
          id: require('node:crypto').randomUUID(),
          archived_at: null,
          deleted_at: null,
          pinned_at: null,
          parent_id: null,
          repost_of_id: null,
          replies_count: 0,
          reposts_count: 0,
          deletion_started_at: null,
          pin_slot: null,
          likes_count: 0,
          comments_count: 0,
          created_at: new Date().toISOString(),
          ...payload,
        };
        state.posts.unshift(post);
        state.posts.forEach(
          (p) =>
            (p.replies_count = state.posts.filter(
              (r) => r.parent_id === p.id && !r.deleted_at && !r.archived_at,
            ).length),
        );
        body = post;
      } else
        body = state.posts
          .filter(
            (post) =>
              visible(post) &&
              !post.deleted_at &&
              (!value('parent_id') || value('parent_id') === post.parent_id) &&
              (!url.searchParams.has('user_id') ||
                url.searchParams.get('user_id') === `eq.${post.user_id}`) &&
              (!value('id') ||
                value('id') === post.id ||
                (value('id').startsWith('in.(') && value('id').slice(4, -1).split(',').includes(post.id))) &&
              (!url.searchParams.has('archived_at') ||
                (url.searchParams.get('archived_at') === 'not.is.null'
                  ? !!post.archived_at
                  : !post.archived_at)) &&
              (!value('media_url') || value('media_url') === post.media_url) &&
              [...url.searchParams]
                .filter(([k]) => k.startsWith('profiles.'))
                .every(([k, v]) => {
                  const profile = [state.profile, ...state.people].find((p) => p.user_id === post.user_id);
                  return (
                    String(profile?.[k.slice(9)] ?? '').toLowerCase() ===
                    v
                      .slice(6)
                      .replace(/\\([\\%_])/g, '$1')
                      .toLowerCase()
                  );
                }) &&
              (!url.searchParams.has('deletion_started_at') || !post.deletion_started_at) &&
              (!url.searchParams.has('deleted_at') || !post.deleted_at) &&
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
            url.searchParams.get('order')?.startsWith('pinned_at')
              ? Number(!!b.pinned_at) - Number(!!a.pinned_at) ||
                (b.pinned_at ?? '').localeCompare(a.pinned_at ?? '')
              : url.searchParams.get('order')?.startsWith('created_at.asc')
                ? a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
                : 0,
          );
      if (Array.isArray(body))
        body = body.slice(
          Number(url.searchParams.get('offset') || 0),
          Number(url.searchParams.get('offset') || 0) + Number(url.searchParams.get('limit') || body.length),
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
