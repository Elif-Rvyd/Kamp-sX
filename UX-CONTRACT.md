# KampüsX interaction contract

Business source: the user's 21 October live schema contract, tracked in
[Social client step one](docs/SOSYAL-ISTEMCI-ADIM-1-2026-10-21.md).
The supplied live catalog and [reply step two](docs/SOSYAL-ISTEMCI-ADIM-2-2026-10-21.md)
add the precise column grants and reply deployment contract. The user confirmed SQL 19/20 on 21 October and SQL 22/23 on 22 October. On 22 October the user also confirmed SQL 21's four-table privilege cleanup and SQL 24's three Storage DELETE policies; local tests do not prove all other live privileges.
The latest authoritative client contract is the user’s 22 October lookup/ID and five-level audience specification, summarized in docs/ISTEMCI-SOZLESMESI-2026-10-22.md. It supersedes the older union/legacy visibility notes. SQL 25 username availability was executed by the user and confirmed as true.
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
- Audience selection derives only from visible_* fields. is_private/visibility are legacy columns and are never queried for privacy or written by the client. Followers = all false; otherwise exactly one flag is true. Accepted followers retain access at every level; RLS alone enforces row visibility and block precedence.

## Confirmed 22 October behavior

- Shared SocialPostCard puts the localized timestamp after content/media. Identity, post text and date are native links; action buttons and video controls remain independent. Search opens real readonly peer profiles and threads.
- Registration requires university, campus and department. Campus replaces the separate faculty field. Public academic values are immutable to clients; Auth metadata changes cannot bypass the SQL guard. Profile editing sends only name/bio/photo changes.
- AccountService owns audience reads/saves using generated public types. Account status uses one native radio group with five choices, confirms actual server values before a success toast, blocks uncertain resubmission until a read, guards dirty navigation and cancels session-bound requests.
- Audiences are exclusive. Everyone is global; University matches university_id, Campus matches university_id + campus_id, and Department matches university_id + department_id without requiring campus. All off selects Followers. A missing campus_id/department_id disables that choice. The SQL helper also governs target visibility for replies/reposts, preserving block and archive behavior.
- Pin/archive use owned UPDATE filters and the three granted state fields. The database serializes pins and caps active pins at three; replies/reposts/quotes cannot be pinned. Archiving or deleting clears the pin. SQL 22 provides an owner-only soft-delete RPC, because hiding a new deleted row can conflict with SELECT checks even without RETURNING. Deleted rows never become readable to work around this.
- After confirmed soft deletion, only canonical owned post media is cleaned; shared live references are retained. Failed cleanup is safely logged without a second delete invitation. No hard delete or deleted-post entry in Archive exists.
- Reports and blocked people use actual reports/blocks tables. A blocked identity may have no display name under RLS; the list shows an honest fallback and supports unblocking.
- Public profiles expose the shared ActionMenu in the top-right toolbar, with confirmed block and
  user-report actions. User reports use reported_user_id with post_id null; PostActionsService owns
  both post/profile moderation. The shared ReportReason molecule owns the five reason choices.
  No user-report uniqueness constraint is invented. Late confirmations cannot target a replacement
  profile/session. Blocking invalidates visible search/profile/post reads and returns to search.
- ProfilePostList separates active pinned root posts under Featured posts without duplicating them
  in the regular list. Its view follows confirmed shared action state; SQL 22 retains the three-pin
  limit. The sidebar has no History item.
- SQL 22/23 were executed by the user; the agent only read live schema metadata to generate types. No production test accounts/posts were created. Public uploads still permit access through an already known URL, and registered academic groups do not establish verified student identity.

## Latest registration and repost behavior

Messaging: /messages is the inbox and /messages/:id the conversation. Profile eligibility comes from
the readonly kx_can_message RPC; only an explicit Message click calls kx_start_conversation. The
server accepts either accepted-follow direction, rejects blocked pairs and owns sender/time fields.
The composer sends only conversation_id/content, preserves rejected drafts and disables sending
after a permission rejection. Ambiguous delivery blocks resubmission until the user checks the
conversation and confirms discarding the draft. Read status is saved only for the visible active
conversation. Message deletion confirms, updates only deleted_at and displays the database-scrubbed
tombstone. History remains readable after unfollow; a blocked conversation disappears through RLS.
INSERT/UPDATE events are invalidations, never rendered payloads. Reconnect refetches; screen exit,
logout and account replacement remove subscriptions and ignore late requests. Drafts are memory-only.

AcademicPicker is a pure shared native select with canonical input styling, operating-system keyboard/type-ahead support and loading/retry/empty states. Free text is unavailable. AcademicService pages approved lookup SELECTs, scoped by the selected university ID. Signup sends selected names, never IDs. University changes clear dependent selects and cancel their stale reads. Missing campus coverage produces an honest empty state. SQL 30 validates approved academic relationships, literal terms/privacy acceptance and current document versions, and stores an immutable server-time receipt. Username availability is debounced, canceled and rechecked before signup; errors preserve the draft and prevent unchecked signup. A confirmed Auth session reads the actually assigned public profile username before offering Continue; email-confirmation signups show it on the first authenticated profile.

Profile name/bio updates send only full_name/bio to the owner public.profiles row. The receipt is checked; metadata refresh cannot overwrite canonical display values. Missing profiles are never recreated by a client media update. Joined date comes from profiles.created_at.

Repost uses the existing posts row with content='', repost_of_id and null parent/media. Duplicate plain reposts reconcile; undo uses the existing owned soft-delete RPC. Quotes require 1–2000 characters and use the same six insert columns. Confirmed membership is hydrated alongside likes/bookmarks/counters. Uncertain quote receipts block another repost/quote for that source during the session. No client counters, fabricated IDs or permanent DELETE are sent. EmbeddedPost renders one readonly original preview; unavailable originals render a localized placeholder. All writes remain subject to existing RLS.

## 22 October release additions

The user's seven-item release request and supplied SQL 28 diagnostics define the current behavior. The user confirmed SQL 29, SQL 32 (release version 2026102204), SQL 30 (registration version 2026102203) and SQL 31 (catalog version 2026102203). SQL 31 is a self-contained atomic block after removing a failed temporary-table dependency. A read-only anonymous API check also confirmed the approved catalog counts and six Ahi Evran campuses. The release report records exact coverage and production verification limits.

| Flow               | Canonical owners                                    | Success                                                             | Failure/recovery                                                                       |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Academic selection | AcademicPicker, AcademicService, RegisterForm       | Approved university and dependent campus/program; mandatory consent | Empty catalog is explicit; retry preserves unrelated fields; stale reads are aborted   |
| Repost / quote     | ActionSheet, ModalDrawer, PostEntry, ConfirmDialog  | Existing posts.repost_of_id and server counters                     | Quote draft preserved; uncertain receipt blocks duplicate write                        |
| Share in a message | SharePost, ModalDrawer, MessagingApiService         | kx_share_post stores only shared_post_id                            | Ineligible recipients disabled; uncertain receipt offers conversation check            |
| Shared message     | MessageBubble, SharedMessagePost, EmbeddedPost      | Original reloaded through current RLS                               | Deleted/archived/hidden source shows unavailable placeholder; no copied source content |
| Post views         | PostViewDirective, PostViewsService, SocialPostCard | Server-deduplicated authenticated account count, author excluded    | Unknown displays em dash; retry reads without resetting to zero                        |
| Legal documents    | LegalDialog, Footer, RegisterForm                   | Distinct TR/EN terms/privacy/cookies; native focus and Escape       | No fabricated company, age requirement, postal address or legal certification          |

The inbox now calls kx_inbox_v2; normal messages retain the existing conversation_id/content-only INSERT. Sharing uses a separate RPC and cannot widen direct INSERT privileges. Realtime payloads remain invalidations; shared originals are re-read after refreshed inbox data, session replacement and social visibility changes. Drafts and recipients are not persisted in browser storage.

## Dashboard world news

Source: the user's request for an X-like world-news box. WorldNewsComponent owns the dashboard-only
disclosure/list; WorldNewsApiService validates the typed response. Button, Icon, locale/theme services
and existing runtime tokens are canonical. At 1024px the blue-tinted rectangular rail opens beside
the feed, scaling from 360 to 460px; below that width it is a collapsed disclosure above the feed.
the toggle exposes aria-expanded/aria-controls, keyboard actions remain native and feed selection
does not change. Four items expand to eight without inventing popularity. Links open Euronews's
article route in a new tab with noopener/noreferrer and explicit accessible new-tab feedback.

The world-news Edge Function verifies a current non-anonymous Auth user and fetches only two fixed
Euronews public news RSS endpoints for TR/EN. Google returned upstream HTTP 503 from the live Edge
runtime; after changing source, the user confirmed actual headlines in the application. The function
uses no database or service-role credential, forwards no account details to Euronews, excludes
images/article bodies, rejects DTD/entities and validates every
URL/date/title. A five-minute per-language cache coalesces in-flight reads; outages may return a clearly
labeled previous update for at most one hour. No news is persisted. Empty/error/loading/refresh states
remain distinct. Session/locale replacement and component destruction abort stale work. Automatic
refresh runs every five minutes only while the panel and document are visible. Local/canonical
production origins are explicitly allowed; optional preview origins require NEWS_ALLOWED_ORIGINS.

Only the dashboard right rail receives the X-like arrangement: shared FormField in sidebar-search
variant, news card, then department suggestions. Sidebar search debounces 300ms and delegates to
the existing people/post search services, showing up to three results of each kind and linking to
the existing full search route. Native links open the selected profile/post. IME, Escape, clearing,
independent failures, stale cancellation and account/privacy invalidation are explicit.

Department suggestions read the current public profile's registered university/department IDs and
query at most 30 visible peers with both exact IDs. Existing caller RLS owns visibility and blocking.
Hydration excludes accepted/pending outgoing follows and displays at most three remaining accounts;
missing IDs or no candidates show an honest empty state. FollowPerson's suggestion variant calls the
existing FollowsService. No migration, policy, Auth metadata, new RPC or server write is introduced.
The small-screen suggestion panel starts collapsed, with request/media listeners cleaned up on exit.

## Help Center support mail

Source: the user's support-form request, explicit Resend choice, confirmed SQL 33 and docs/DESTEK-EPOSTA-KURULUMU.md. `/help` is an authenticated social route, linked from the persistent sidebar. It uses SocialPageFrame, FormField, Button, ConfirmDialog and LegalDialog. Tokens remain owned by tokens.css. The separate support notice explains the new Resend/Gmail data flow without changing the texts or versions already acknowledged at registration.

GET verifies the current Auth user and the owned profile username. The two identity controls are readonly. POST includes only request_id/description; the Edge handler re-verifies identity and uses server-only sender/recipient settings. Plain-text email, exact origin policy, request-size/deadline limits, durable SQL rate limits and service-only dispatch RPCs constrain abuse. Provider credentials and service_role never enter browser configuration.

Loading, missing setup, rate rejection, success and uncertain delivery have distinct TR/EN feedback. A successful provider receipt clears the draft and shows its reference, without claiming inbox delivery. Ambiguous writes lock the description and offer status-only recovery; explicit safe retry retains the same immutable ID/body. Session replacement aborts work and ignores late responses. Dirty navigation uses the canonical discard dialog; real unload gets a narrow beforeunload guard. No draft is persisted. Cancellation cannot recall an email already accepted by the server.

The legal text distinguishes accepting terms from acknowledging the privacy notice. Its operator/contact come from the user. KVKK primary references: https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu- and https://www.kvkk.gov.tr/Icerik/6765/AYDINLATMA-YUKUMLULUGUNUN-YERINE-GETIRILMESI-HAKKINDA-KAMUOYU-DUYURUSU. Public media URL access and lack of end-to-end encryption are stated truthfully; operator review of retention and transfer arrangements remains necessary before claiming legal compliance.
