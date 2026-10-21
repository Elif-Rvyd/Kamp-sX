# KampüsX interaction contract

Business source: the user's 21 October live schema contract, tracked in
[Social client step one](docs/SOSYAL-ISTEMCI-ADIM-1-2026-10-21.md).
The supplied live catalog and [reply step two](docs/SOSYAL-ISTEMCI-ADIM-2-2026-10-21.md)
add the precise column grants and reply deployment contract. The user confirmed SQL 19/20 on 21 October and SQL 22/23 on 22 October. On 22 October the user also confirmed SQL 21's four-table privilege cleanup and SQL 24's three Storage DELETE policies; local tests do not prove all other live privileges.
The older [Post actions and media privacy ADR](docs/adr/001-post-actions-and-media-privacy.md)
describes staged legacy capabilities; it must not override the current production contract.
The existing welcome/auth design, runtime CSS variables and TR/EN dictionaries remain canonical.

Invalid form submission uses the shared validateAndFocus helper. It focuses the first enabled
invalid native control using Angular validity classes, without waiting for touched aria-invalid
attributes to render. Auth, recovery and profile editor retain the same focus behavior.

The 18 October full-width decision applies to every route. Public/auth page-container uses the
shared percentage width token and existing responsive gutters; authenticated surfaces fill the
space after the persistent sidebar. Forms retain native document scrolling rather than a clipped
viewport height. Composer preparation/upload/saving status and validation errors remain visible;
the static compression/public-file explanatory paragraphs are omitted at the user's request.
PostsService reads only real public.posts columns from the generated Database contract. Publication
returns only id/user_id/content/media_url/media_type/created_at within the existing basic read grants,
and still verifies the receipt before success/navigation. File preparation and Storage visibility do
not change. Owner actions use SQL 22 and the live generated schema. The 22 October account/audience decision is recorded in docs/HESAP-VE-GONDERI-GUNCELLEMELERI-2026-10-22.md.

Follow requests source: [Part A contract](/C:/Users/elifr/source/project/web/KampüsX/docs/PARCA-A-TAKIP-ISTEKLERI.md),
the supplied production catalog, and CLI-generated public types. FollowsService owns relationship
transitions/counts/private invalidation; FollowPerson reuses Avatar/Button. Own list routes are
`/profile/followers`, `/profile/following`, `/profile/requests`; Settings exposes requests.
Username lookup is exact, explicitly submitted, session-local and aborts stale requests.
Lists page 30 raw relationships with a cursor independent of RLS-hidden profiles. Realtime refresh
resets paging and reserves prior list height. Removed focused actions return focus to the active
list link without stealing new input focus. Failures preserve server-confirmed state and support
retry; zero affected request mutations report a conflict. Only accepted rows count as followers.
Pending counts stay separate. No optimistic acceptance or fabricated profile identity is shown.
Before any follow write the version RPC verifies the migration is installed. Missing setup disables
actions. Session/epoch teardown invalidates reads/writes; public Storage behavior stays unchanged.

| Capability | Canonical owner                                | Source of truth                        | Allowed variants                                    | Verification                  |
| ---------- | ---------------------------------------------- | -------------------------------------- | --------------------------------------------------- | ----------------------------- |
| Form       | FormField, PasswordField, Button               | Angular controls and existing services | Multiline, floating, readonly                       | Unit/browser suites           |
| Toast      | Toast + NoticeService                          | Confirmed operation result             | Shared translated success, inline persistent errors | Post action browser tests     |
| CRUD       | PostEntry + PostActionsService + ConfirmDialog | ADR and PostgreSQL RLS/RPC             | Own actions, other-author actions, archive restore  | SQL/service/browser tests     |
| Scrollbar  | Existing global styles                         | Runtime design tokens                  | Existing document flow                              | Narrow viewport browser tests |

- Persistent sidebar owns authenticated navigation. Settings/search/thread routes share this shell,
  without welcome header/footer. Settings contains Account visibility, Follow requests, Archive, Bookmarks and Blocked people.
- ActionMenu uses native buttons and Arrow/Home/End/Escape/Tab behavior. Selection restores trigger
  focus before opening a shared ConfirmDialog. Native dialogs use the browser top layer.
  `--z-post-menu: 60` belongs to social layout, above its sticky headers at 40. No palette values change.
- Confirm permanent deletion and blocking. Default focus is Cancel; Escape cancels. Failure stays
  inline, preserving report reason/comment draft and offering retry. Success uses shared Toast.
- Archive/restore and pin/unpin commit before success feedback. Archive/delete changes refresh
  collections from the first page, avoiding an empty out-of-range page.
- Likes/bookmarks read the real public.likes/public.bookmarks tables and server-managed
  posts.likes_count/replies_count/reposts_count. They wait for initial server state, then update
  optimistically with a per-post busy lock. Inserts send only user_id/post_id; deletes filter both.
  No reaction RPC or client counter write is used. Confirmed writes read back membership and counters;
  duplicate inserts reconcile without double increments. Errors roll back the temporary display,
  disable reactions and offer one translated error/Retry. Retry only reads; a lost receipt never
  repeats the write. Session replacement invalidates late results.
  Bookmarks uses an inner posts relation so RLS owns visibility; no local privacy predicates are added.
- Archive/bookmark/block lists load 30 rows at a time; comments load 50. Load more is explicit.
  Paging is temporary session UI, reset on collection changes and route entry. Private IDs and draft
  text are not persisted. Search's query is URL state (`?q=`), limited to 120 characters. Search
  automatically finds up to 20 other profiles by partial name/username and the newest 30 matching
  posts, in separate labelled sections. It is debounced 300 ms, IME-aware and session-bound;
  every edit immediately aborts/invalidate old reads, including while the debounce is pending.
  Enter commits immediately; there is no Search submit button. FormField's optional clear action
  cancels work, removes both result collections and returns focus to the input immediately.
  Profile discovery uses the existing authenticated public.profiles RLS and FollowsService
  hydration/status validation; it never lists Auth users; SQL 23 separately adds the approved audience restrictions.
- Replies are posts with parent_id, with one nested reply level. PostThread keeps a stable post input
  for PostEntry; the card owns the optimistic view, avoiding a reactive feedback loop. Root and nested
  collections page 50 raw rows independently, including when a locally confirmed receipt is shown.
  Nested rows load on demand with Retry; no reply controls appear on the deepest allowed level.
  Inserts send only the six granted columns, with server-generated IDs. The SQL 20 version gate
  refuses new writes if its database depth guard is missing. Failed known rejections preserve the
  draft and allow retry. Ambiguous responses preserve the draft but disable resubmission: Refresh
  only reads, and Clear draft requires the shared discard confirmation. No made-up idempotency ID
  or text-match deduplication is used. Server-managed replies_count is refetched separately; a failed
  counter read never converts a confirmed reply into a retryable write failure. Session replacement
  and destruction abort reply work and ignore stale results before applying page state.
  In-app navigation confirms discarding an unsent reply. SQL 20 repairs only the recursive INSERT
  target check using the exact supplied SELECT visibility rule; other policies are preserved.
- Session replacement invalidates async writes and local previews. Media uses the existing public URL
  rendering path; the private download/blob cache was reverted by the user on 18 October 2026.
  Blocking hides application rows/interactions; a known public media URL remains accessible.
  Local edit previews stay local. No simulated auth/session is introduced.
- Legacy profile privacy stays intact until the user explicitly saves audience preferences. Thereafter matching selected audiences can directly see the profile/posts, with blocks still taking precedence. Search remains an authenticated RLS-controlled directory.
  Billing/payment/moderation-admin workflows are outside the requested scope.

## Confirmed 22 October behavior

- Shared SocialPostCard puts the localized timestamp after content/media. Identity, post text and date are native links; action buttons and video controls remain independent. Search opens real readonly peer profiles and threads.
- Registration requires university, campus and department. Campus replaces the separate faculty field. Public academic values are immutable to clients; Auth metadata changes cannot bypass the SQL guard. Profile editing sends only name/bio/photo changes.
- AccountService owns audience reads/saves using generated public types. Account status uses the shared Switch, confirms actual server values before a success toast, blocks uncertain resubmission until a read, guards dirty navigation and cancels session-bound requests.
- Visible audiences are a union. Explore is global, then university, campus and department are progressively narrower; all off is owner only. Before the first preference save, legacy rules apply. The SQL helper also governs target visibility for replies/reposts, preserving block and archive behavior.
- Pin/archive use owned UPDATE filters and the three granted state fields. The database serializes pins and caps active pins at three; replies cannot be pinned. Archiving or deleting clears the pin. SQL 22 provides an owner-only soft-delete RPC, because hiding a new deleted row can conflict with SELECT checks even without RETURNING. Deleted rows never become readable to work around this.
- After confirmed soft deletion, only canonical owned post media is cleaned; shared live references are retained. Failed cleanup is safely logged without a second delete invitation. No hard delete or deleted-post entry in Archive exists.
- Reports and blocked people use actual reports/blocks tables. A blocked identity may have no display name under RLS; the list shows an honest fallback and supports unblocking.
- SQL 22/23 were executed by the user; the agent only read live schema metadata to generate types. No production test accounts/posts were created. Public uploads still permit access through an already known URL, and registered academic groups do not establish verified student identity.
