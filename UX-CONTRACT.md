# KampüsX interaction contract

Business source: [Post actions and media privacy ADR](docs/adr/001-post-actions-and-media-privacy.md).
The existing welcome/auth design, runtime CSS variables and TR/EN dictionaries remain canonical.

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

| Capability | Canonical owner                                | Source of truth                        | Allowed variants                                         | Verification                  |
| ---------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| Form       | FormField, PasswordField, Button               | Angular controls and existing services | Multiline, floating, readonly                            | Unit/browser suites           |
| Toast      | Toast + NoticeService                          | Confirmed operation result             | Shared translated success, inline persistent errors      | Post action browser tests     |
| CRUD       | PostEntry + PostActionsService + ConfirmDialog | ADR and PostgreSQL RLS/RPC             | Own actions, other-author actions, pending cleanup retry | SQL/service/browser tests     |
| Scrollbar  | Existing global styles                         | Runtime design tokens                  | Existing document flow                                   | Narrow viewport browser tests |

- Persistent sidebar owns authenticated navigation. Settings/search/thread routes share this shell,
  without welcome header/footer. Settings contains Archive, Bookmarks and Blocked people.
- ActionMenu uses native buttons and Arrow/Home/End/Escape/Tab behavior. Selection restores trigger
  focus before opening a shared ConfirmDialog. Native dialogs use the browser top layer.
  `--z-post-menu: 60` belongs to social layout, above its sticky headers at 40. No palette values change.
- Confirm permanent deletion and blocking. Default focus is Cancel; Escape cancels. Failure stays
  inline, preserving report reason/comment draft and offering retry. Success uses shared Toast.
- Archive/restore and pin/unpin commit before success feedback. Archive/delete changes refresh
  collections from the first page, avoiding an empty out-of-range page.
- Likes/bookmarks wait for initial server state, then update optimistically with a per-post busy lock.
  Errors roll back state. Failed state reads expose Retry and disable reaction controls.
- Archive/bookmark/block lists load 30 rows at a time; comments load 50. Load more is explicit.
  Paging is temporary session UI, reset on collection changes and route entry. Private IDs and draft
  text are not persisted. Search's query is URL state (`?q=`), limited to 120 characters and newest
  30 results, debounced 300 ms, IME-aware, cancelable and stale-safe.
- Comments allow one reply level. Failed submit preserves text and a retry ID, avoiding duplicates
  after uncertain responses. In-app navigation confirms discarding an unsent comment.
- Session replacement invalidates async writes and local previews. Media uses the existing public URL
  rendering path; the private download/blob cache was reverted by the user on 18 October 2026.
  Blocking hides application rows/interactions; a known public media URL remains accessible.
  Local edit previews stay local. No simulated auth/session is introduced.
- Existing own-profile privacy stays intact. Search reads posts; it is not an Auth user directory.
  Billing/payment/moderation-admin workflows are outside the requested scope.
