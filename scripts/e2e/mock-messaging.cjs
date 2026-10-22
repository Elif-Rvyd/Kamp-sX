const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const CONV = '77777777-7777-4777-8777-777777777777';
async function mockMessaging(page, options = {}) {
  const state = {
    canSend: true,
    hidden: false,
    failSend: false,
    uncertain: false,
    sends: [],
    reads: 0,
    starts: 0,
    requests: [],
    joins: [],
    leaves: [],
    messages: [
      {
        id: '88888888-8888-4888-8888-888888888888',
        conversation_id: CONV,
        sender_id: B,
        content: 'Merhaba Elif',
        created_at: '2026-10-22T10:01:00+00:00',
        deleted_at: null,
      },
    ],
    ...options,
  };
  let socket;
  const topics = new Map();
  await page.routeWebSocket('**/realtime/v1/**', (ws) => {
    socket = ws;
    ws.onMessage((raw) => {
      const [joinRef, ref, topic, event, data] = JSON.parse(String(raw));
      if (event === 'phx_join') {
        const filters = (data.config?.postgres_changes ?? []).map((filter, i) => ({ ...filter, id: i + 10 }));
        topics.set(topic, filters);
        state.joins.push(topic);
        ws.send(
          JSON.stringify([
            joinRef,
            ref,
            topic,
            'phx_reply',
            { status: 'ok', response: { postgres_changes: filters } },
          ]),
        );
      } else if (event === 'phx_leave' || event === 'heartbeat') {
        if (event === 'phx_leave') {
          topics.delete(topic);
          state.leaves.push(topic);
        }
        ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]));
      }
    });
  });
  state.emit = (type = 'INSERT') => {
    for (const [topic, filters] of topics) {
      const ids = filters.filter((f) => f.event === type && f.table === 'messages').map((f) => f.id);
      if (ids.length)
        socket.send(
          JSON.stringify([
            null,
            null,
            topic,
            'postgres_changes',
            {
              ids,
              data: {
                schema: 'public',
                table: 'messages',
                type,
                commit_timestamp: new Date().toISOString(),
                columns: [],
                record: {},
                old_record: {},
                errors: null,
              },
            },
          ]),
        );
    }
  };
  state.disconnect = () => socket?.close({ code: 1001, reason: 'Test reconnect' });
  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      name = url.pathname.split('/').at(-1),
      method = request.method();
    if (
      ![
        'messages',
        'kx_can_message',
        'kx_start_conversation',
        'kx_inbox',
        'kx_inbox_v2',
        'kx_share_post',
        'kx_mark_read',
      ].includes(name)
    )
      return route.fallback();
    const body = ['POST', 'PATCH'].includes(method) ? request.postDataJSON() : null;
    state.requests.push({ name, method, body, query: Object.fromEntries(url.searchParams) });
    const ok = (value) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
    const denied = () =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: '42501', message: 'dm_unavailable' }),
      });
    if (name === 'kx_can_message') return ok(state.canSend && !state.hidden);
    if (name === 'kx_start_conversation') {
      state.starts++;
      return state.canSend && !state.hidden ? ok(CONV) : denied();
    }
    if (name === 'kx_mark_read') {
      state.reads++;
      return state.hidden ? denied() : ok(true);
    }
    if (name === 'kx_inbox' || name === 'kx_inbox_v2') {
      if (state.failInbox)
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'PGRST000', message: 'Test read failure' }),
        });
      const last = state.messages.at(-1);
      return ok(
        state.hidden || state.empty
          ? []
          : [
              {
                conversation_id: CONV,
                peer_id: B,
                peer_username: 'deniz',
                peer_full_name: 'Deniz Yıldız',
                peer_avatar_url: null,
                last_content: last?.content ?? null,
                last_shared_post_id: last?.shared_post_id ?? null,
                last_created_at: last?.created_at ?? null,
                last_deleted_at: last?.deleted_at ?? null,
                unread_count: state.reads ? 0 : 1,
                can_send: state.canSend,
              },
            ],
      );
    }
    if (name === 'kx_share_post') {
      if (state.failSend || !state.canSend || state.hidden) return denied();
      state.sends.push(body);
      const id = `99999999-9999-4999-8999-${String(state.sends.length).padStart(12, '0')}`;
      state.messages.push({
        id,
        conversation_id: CONV,
        sender_id: A,
        content: 'Post shared',
        shared_post_id: body.target,
        created_at: new Date().toISOString(),
        deleted_at: null,
      });
      if (state.uncertain) return route.abort('failed');
      return ok(id);
    }
    if (method === 'POST') {
      state.sends.push(body);
      if (state.failSend || !state.canSend || state.hidden) return denied();
      state.messages.push({
        id: `99999999-9999-4999-8999-${String(state.sends.length).padStart(12, '0')}`,
        conversation_id: CONV,
        sender_id: A,
        content: body.content,
        created_at: new Date().toISOString(),
        deleted_at: null,
      });
      if (state.uncertain) return route.abort('failed');
      return route.fulfill({ status: 201, body: '' });
    }
    if (method === 'PATCH') {
      const row = state.messages.find(
        (m) => 'eq.' + m.id === url.searchParams.get('id') && m.sender_id === A,
      );
      if (row) {
        row.deleted_at = new Date().toISOString();
        row.content = '';
      }
      return route.fulfill({
        status: 204,
        headers: { 'content-range': row ? '0-0/1' : '*/0', 'access-control-expose-headers': 'content-range' },
        body: '',
      });
    }
    let rows = state.hidden ? [] : [...state.messages].reverse();
    const ids = url.searchParams.get('id');
    if (ids?.startsWith('in.(')) rows = rows.filter((r) => ids.includes(r.id));
    if (url.searchParams.has('or')) {
      const cutoff = url.searchParams.get('or').match(/created_at.lt.([^,]+)/)?.[1];
      rows = rows.filter((r) => r.created_at < cutoff);
    }
    return ok(rows.slice(0, Number(url.searchParams.get('limit') ?? rows.length)));
  });
  return state;
}
module.exports = { mockMessaging, A, B, CONV };
