---
version: alpha
name: KampüsX
description: An editorial campus noticeboard with layered social previews and quiet authentication.
colors:
  background: '#F6F4ED'
  surface: '#FFFFFF'
  text: '#15213A'
  muted: '#526078'
  primary: '#2155E8'
  accent: '#007E98'
  yellow: '#F3DA70'
  coral: '#FFAD97'
  danger: '#B32743'
  success: '#167047'
typography:
  sans:
    fontFamily: 'Plus Jakarta Sans, Arial, sans-serif'
  mono:
    fontFamily: 'JetBrains Mono, Consolas, monospace'
rounded:
  control: '10px'
  panel: '24px'
spacing:
  unit: '4px'
  page-max: '100%'
components:
  button:
    rounded: '{rounded.control}'
    backgroundColor: '{colors.primary}'
    textColor: '{colors.surface}'
  auth-panel:
    rounded: '{rounded.panel}'
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
  label:
    textColor: '{colors.muted}'
  focus:
    textColor: '{colors.accent}'
  sticker:
    backgroundColor: '{colors.yellow}'
    textColor: '{colors.text}'
  sticker-coral:
    backgroundColor: '{colors.coral}'
    textColor: '{colors.text}'
  error:
    textColor: '{colors.danger}'
  success:
    textColor: '{colors.success}'
---

# KampüsX Design System

## Overview

The reference is a university festival noticeboard meeting a student magazine cover.
Turkish university students should see a real social world before choosing how to join it.
The blue campaign poster is the memorable signature: overlapping posts, original campus
illustration, small handwritten-feeling stickers, and a strong three-line headline.
Forms stay familiar and quiet. Authentication feedback describes actual outcomes,
without preview labels in the campaign header or footer.

This is a hybrid surface: the welcome route is marketing; the auth panel and `/auth/*`
routes use shared product form controls. Email/password authentication now uses Supabase;
posts/profiles/follows use Supabase; academic feeds use the registered public profile scopes after SQL 23; Google OAuth is not connected. A remembered session uses
persistent browser storage; an unremembered session uses session storage.
Audience evidence: the supplied KampusX-welcome-spec2.md and the user's Angular/Nx request.
Turkish and English are equally supported. Browser language sets the initial locale;
the explicit language choice overrides it and survives reloads.

Avoid a generic dashboard card grid as the page's overall composition. The community
directory is deliberately a consistent card grid because its items are comparable.
The legal dialog contains separate TR/EN terms, privacy and cookie texts dated 22 October 2026.
Operator identity is the user's supplied Elif Rüveyda Ulama (elify.dev), with the supplied contact email.
Do not invent a corporation, postal address, age restriction, student verification or certified legal compliance.

## Colors

Canonical runtime ownership is **Model B**: `libs/shared/design-tokens/tokens.css` owns values.
This document mirrors the accepted light values and explains intent. The CSS defines both
themes; Tailwind v4.3.3 loads the existing variable-based preset with `@config`, never independent copies of raw values.
`.postcssrc.json` owns the Tailwind v4 PostCSS integration; sources are limited to shell and shared UI.

Light uses warm paper, navy text, saturated cobalt, and a deeper accessible cyan.
Dark uses `#0B0E14` background, `#151B28` surface, `#EDF2FF` text, `#A6B3CA` muted,
`#ADC6FF` primary, `#102451` on-primary and `#4CD7F6` accent.
Poster colors are a separate expressive role; they remain rich blue in both themes.
Yellow and coral stickers always use dark ink. Semantic errors and successes retain text and icons.
Forced colors restores system colors and borders. Contrast is checked at runtime in both themes.

## Typography

Plus Jakarta Sans is the body, control, and heavy display family. JetBrains Mono carries
numbers, hashtags, small editorial metadata, and translation-neutral language selectors.
Turkish diacritics use the full Google Fonts subset; Arial/Consolas are reliable fallbacks.
Headlines are tightly spaced and balanced; small metadata is not used for essential form instructions.
English copy is independently written. Long text wraps instead of truncating important content.

## Layout

The document owns vertical scrolling. On the user's 18 October request, all routes use the available viewport width with 40px desktop gutters,
24px tablet gutters, and 16px phone gutters. Header height decreases from 82px to 66px.
The hero uses roughly 7/12 poster and 5/12 auth with matching top and bottom edges.
The shared grid row stretches both surfaces; the poster's scene grows with the form's
natural height. The student trust note sits inside the auth panel. At 640px the hero
becomes a single column with independent natural heights.
Community cards use four columns, two at tablet/phone, and contain all eight sample communities.
Form fields and buttons have stable height; messages have reserved space. Images use explicit geometry.
Auth form switching expands the desktop row when needed and never clips registration fields.
Header actions contain language, theme and mobile navigation. About, privacy, terms
and cookies navigation belongs in the footer; registration keeps its consent links.

The runtime `--page-max: 100%` token is shared by welcome, auth and not-found containers.
Authenticated page surfaces occupy the entire area after the persistent sidebar: composer,
profile editor, settings, archive, bookmarks, blocked people, search, post detail and follow lists.
Their former 760px cap is removed. Auth pages retain their campaign/form treatment with two
equal flexible columns on desktop. This changes layout geometry only; colors, fonts, controls,
theme switching, mobile stacking and native document scrolling remain canonical.
Shared Material Symbols reserve a one-em square and clip descriptive fallback ligature names
while their font is unavailable, so edge-aligned icons cannot widen a full-width page.

## Elevation & Depth

Depth is intentional on the layered poster and auth panel. Chapter boundaries use thin rules.
Community hover movement is restrained and does not hide actions. The sticky header uses blur.
The dark theme uses distinct tonal surfaces rather than merely inverting light colors.

## Shapes

Controls use 10px radius, auth panels 24px, post previews 13px, and community cards 14px.
The poster and CTA have alternating sharp/rounded corners, recalling cut paper.
Stickers use outlined corners or a circle with a small offset ink shadow.

## Components

| Owner                                               | Runtime mapping                                 | Consumers                             |
| --------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `tokens.css` primary, on-primary                    | Tailwind preset `colors.primary`, CSS variables | Button, focus, links, selected tabs   |
| `tokens.css` bg/surface/text/muted                  | Tailwind color aliases and semantic CSS         | All shared UI and sections            |
| `tokens.css` font-sans/font-mono                    | Tailwind font aliases and native CSS            | Headings, copy, metadata              |
| `tokens.css` radius-control/panel                   | Tailwind radius aliases and native CSS          | Fields, buttons, auth panel           |
| `tokens.css` scroll tokens                          | Global scrollbar rules in `styles.css`          | Every owned scroll surface            |
| `tokens.css` surface-alt/text/border/primary/accent | Shared marquee CSS                              | Campus agenda strip and pause control |

Shared atoms: native button, native input directive, badge, logo, icon, sticker, toggle.
Molecules own form-field association, password reveal/strength, feature/stat cards, theme/language controls.
Organisms own post/community previews, marquee, and legal dialog.
Shell features own auth business state and landing sections; shared UI never imports shell services.
`libs/shared/ui/styles.css` owns atomic component appearance and responsive variants.
Every consuming app imports it once after `tokens.css`; shell CSS owns campaign/layout composition.

Buttons have solid, outline, and ghost emphasis. Loading hides the stable label geometry under
an app-owned spinner, exposes aria-busy, and disables duplicate submits. Disabled controls are honest.
Fields associate labels, help and error text, use reactive validators, and focus the first invalid field.
Password form values are never stored by application code. Supabase owns session credentials.
The user's 15 October security decision replaces account discovery with one generic credential error.
Unknown email and incorrect password use the same TR/EN credentials key. Login sends no account-existence
RPC; network, quota and email-confirmation failures retain actionable, non-password-revealing feedback.
The disabling migration revokes the legacy RPC's execute grant from PUBLIC, anon and authenticated;
it must be applied on the live database independently of deploying the frontend.
Passwords support password managers, paste and accessible reveal controls. New-password and
confirmation fields reuse the password molecule with distinct translated labels.
The `/auth/update-password` page waits for auth initialization and accepts only a session established
by a password-recovery callback. Missing or expired links offer a fresh reset request. Successful
password updates end the current session and offer sign-in with the new password; a sign-out failure
keeps a truthful saved-password notice and retry action instead of reporting completion.

The legal dialog uses native modal dialog behavior: focus isolation, Escape dismissal and focus return.
The authenticated `/dashboard` route uses a full-width campus feed shell, with existing logo,
language and theme controls. It consumes the canonical tokens without changing them or the
theme services. Shared Avatar, TabStrip and FeedSkeleton own its reusable UI.
SocialLayout owns a permanent left navigation across dashboard, profile, editor and composer.
The existing profile-menu component is reused as a semantic aside with native links, active-route
state and no overlay, open/close state, focus trap or scroll lock. It is 280px on desktop,
a 76px icon rail at 1100px and below, and a 60px rail at 600px and below. The content uses the
remaining document width; normal document scrolling and the existing scrollbar gutter are retained.
The sidebar's expanded header
contains the signed-in user's display name, handle, university, department and real, nullable follow counts. Profile metadata is
display content only; missing university/department values use honest localized placeholders.
The sidebar's sign-out control closes the real Supabase session. Home, Profile and Publish navigate;
Search, Settings, Messages and Help Center use real routes; communities remain a disabled visual entry. History is removed.
The skip link targets the content after the sidebar. Discovery uses a single selected index
for tab clicks, Arrow/Home/End keys and horizontal touch swipes. Vertical document scrolling
remains native; the shared sidebar replaces the duplicate bottom navigation and floating compose control. Motion is transform/opacity
only and honors reduced motion. The active academic/Explore tab loads real rows with loading, error/retry and empty states. Email/password sign-in redirects to dashboard
only after Supabase returns a session; registration with no session keeps email-verification guidance.
The dashboard guard verifies the session with Supabase getUser; valid signed-in users skip login/register,
and password recovery keeps its own route. Session loss returns to login. The existing auth forms keep
their visual design and welcome keeps its public chrome. Plain login URLs are not treated as callback
links; callback detection requires actual auth parameters. Explore reads authenticated public.posts rows. No fake session is created by dashboard.
University, campus and department feeds join canonical public profiles through posts.user_id. Filters use registered university/campus/studying, retain RLS and show an honest error for incomplete legacy identity.
The lazy `/profile` and `/profile/edit` routes retain the existing session guard. ProfileService
seeds display identity from the existing session and reloads canonical public profile fields. The joined date comes from the actual account/profile creation time. Name and bio use allowlisted Auth display metadata; SQL 23 synchronizes those two values to public profiles. Photos use public.profiles by user_id. Username and academic identity are readonly in the editor. Registration requires name, username, university, campus and department; bio remains optional. The visible academic field is Campus rather than a separate Faculty field. Existing faculty_name is mapped to campus only by the approved migration. Public profile rows and Auth metadata have database guards against client academic changes. These are self-declared registration details, not verified academic credentials.
The editor sends only name, bio and photo changes; tampered academic payloads are rejected or ignored at explicit boundaries. Text and media cannot commit as one transaction, so partial saves remain truthful. Profile/drawer updates use the same session-bound signals.
Upload ownership and a session epoch are checked across asynchronous boundaries. Logout or replacement login
invalidates pending work, including a re-login to the same user; token refresh alone does not. Dirty profile/post
editors leave on session loss without trapping the user in a discard dialog or retaining the old draft.
ProfileRepository snapshots only avatar_url/banner_url and validates their owner and purpose at runtime;
TypeScript payload types are not treated as a security boundary. Media URLs accept only canonical
uid/area/safe-filename paths and the supported image/video extensions in the configured bucket. PNG, JPEG
and WebP dimensions are checked before decoding, with browser decoding and a final pixel-limit check.
Avatar, scrollable TabStrip and floating FormField extend existing owners through optional variants.
FollowsService uses the actual public.follows follower_id/following_id/status contract and live-generated public types. Only accepted relations count; pending requests are separate. Part A uses private empty Broadcast invalidations for the two participants, guarded reserved topics, reconnect refetch, request cancellation and session-bound teardown. The database sets pending/accepted from the target privacy, limits acceptance to the recipient, serializes follow/block writes, and retains all existing relations. A version RPC blocks frontend writes until the migration is installed. Own followers/following/request routes use the existing SocialPageFrame, shared FollowPerson with Avatar/Button, FormField for exact username lookup, and NoticeService. Counts in profile/sidebar link to the lists; Settings links to requests. New routes are classified as authenticated social screens. Existing UI tokens, welcome/auth forms, profile editing and public Storage stay canonical.
SocialPostCard owns feed cards; the marketing PostCardPreview remains its separate existing preview.
Likes/bookmarks reuse SocialPostCard, PostEntry and the existing collection page. Their real table
integration changes no tokens, layout or shared-component dependencies. Pending writes disable
duplicate actions; failures use a single inline translated message with read-only Retry. Counters
come from posts, and saved post visibility comes from RLS. The 21 October live contract supersedes
legacy reaction RPC assumptions; the remaining social actions are separately staged.
PostThread reuses the same card, FormField, Button, ConfirmDialog and social page frame. Replies
stay in the existing bordered document flow; nested replies retain the existing inset border.
Children expand on demand with their own loading/error/paging state. No visual tokens change.
An uncertain reply receipt keeps the draft with translated read-only Refresh and confirmed Clear
actions, while submit is disabled. The server owns IDs and counters; no synthetic retry ID is sent.
The search route keeps that visual language: shared FormField with an optional clear icon, then
People and Posts sections separated by existing rules. Profile results reuse FollowPerson's
Avatar, identity and verified follow controls. Partial name/username search runs while typing;
the former Search submit button is removed. Existing tokens, themes, public/auth pages and
database privacy remain unchanged.
ImagePicker owns native file selection and staged previews, ConfirmDialog owns draft-discard confirmation,
and Toast with NoticeService owns saved feedback across route changes. MediaService owns uploads to the existing uploads bucket; ProfileRepository and PostsService own the DB boundary. The private Storage change was reverted on 18 October 2026 at the user’s request. Media is rendered through the existing public URLs. SQL 12 preserves bucket visibility; optional SQL 13 restores Public if the private setup was applied manually. Blocking governs app rows and interactions, not access to a known public file URL. UX-CONTRACT.md and docs/adr/001-post-actions-and-media-privacy.md record the accepted interaction and permission source.
File selection only stages previews; Save/Publish performs network writes. The post composer announces preparation, Storage upload and database saving in a reserved status region without inventing percentage progress. A successful post response must match the owner, text and expected media URL/type; mismatches are uncertain outcomes and block blind retries. Feed media must match the row owner, post area and declared format. File bytes and blob/data URLs never enter application database payloads. URLs use uid/purpose/random paths and only
the configured bucket origin is rendered. Confirmed uploads can be reused after a rejected DB write.
Storage and database writes are separate operations. SQL 22 soft deletes only an authenticated owner’s row through a narrow RPC; deleted rows remain hidden by SELECT RLS. Only after confirmation does the client attempt canonical owned post-media cleanup, skipping files referenced by another live owned post. Cleanup failure emits a safe diagnostic, never restores the row or invites a second delete. Archive contains archived, undeleted rows only.
Storage failures distinguish session, denied access, unavailable bucket, bucket limits, throttling and network failures
without exposing raw server responses. Failed uploads preserve the draft and never insert a post.
Post composer uses existing FormField/Button/ConfirmDialog owners and the same protected navigation/draft contract.
Ambiguous publication outcomes block blind retries. Only confirmed success triggers the shared toast and feed navigation.
A post is at most 2000 characters with one optional image/video. Post image selection accepts JPG/PNG/WEBP sources up to 20 MiB and 32 megapixels; the existing image utility scales without upscaling to 2048×2048 and always encodes decoded pixels as WebP at at most 2 MiB, stripping source EXIF/XMP/location tags even from small images. MediaService caches prepared File objects for preview and retry; upload revalidates the final image against the 5 MiB and pixel limits.
MP4/WEBM videos at or below 50 MiB are remuxed without re-encoding their primary audio/video packets. Descriptive container tags, attachments and source track names are omitted. Larger sources, bounded to 512 MiB and 30 minutes, use bounded compression with the same metadata cleanup. Both paths use the shared post-video preparation utility and a local Web Worker with pinned Mediabunny; only compression needs WebCodecs encoders. The worker loads on video selection and has no Supabase client, credentials or network destination. Duration and primary audio are retained; unsupported audio/video conversion fails visibly instead of silently dropping sound. Resolution is scaled without upscaling and bitrate is calculated from duration, with up to three bounded passes and an independently checked 50 MiB final limit. The source is never truncated or uploaded as a fallback. Small-video remux uses the existing preparing status; actual compression progress is announced below 100% until completion. The attachment button becomes Cancel preparation. Cancel, component destruction, session replacement, malformed worker replies, worker failures and the ten-minute deadline release the worker, while text and any previously selected valid file remain intact. Source signatures and final playback metadata are validated before upload. At the user's request, the static compression and public-file hints are omitted from the composer; preparation, progress and actionable errors remain. Public Storage behavior is unchanged.
Profile images are decoded locally (input at most 20 MiB / 32 megapixels), scaled without upscaling to 640×640 for avatars and 1920×1080 for banners, and always encoded from pixels as WebP at at most 1 MiB so source metadata is not published. The existing upload service revalidates the result. Bitmap/canvas/worker resources are released and pending work cannot cross sessions. Profile and media geometry stays reserved.
The profile uses a 3:1 cover, an overlapping 96px avatar, a 64px sticky toolbar and sticky scrolling tabs.
Other users' profiles place the canonical surfaced ActionMenu at the toolbar's right edge, matching
the existing back control over cover images. Reporting reuses the shared reason picker and dialog.
Pinned posts use a simple Featured posts heading and existing post cards, before the remaining list;
the sidebar omits History. No palette, typography or layout tokens change for these additions.
IntersectionObserver controls only opacity/transform header motion and is disconnected on teardown.
The editor uses equal left/right action columns (Cancel and Save), with a centered single-line title, including 320px phones. Account information heads the fields. It blocks duplicate saves. Profile ImagePicker removes files through a translucent centered X revealed on hover or keyboard focus; coarse/touch pointers keep the action visible. The avatar camera stays at the lower-right edge. Informational format/size and account/public-file disclaimers are omitted from the editor by the user’s explicit request; actionable validation errors remain.
Dirty route departures use the native shared confirmation dialog, Escape keeps edits, focus returns,
and saved changes update the drawer and every own post card through the same signal.
Production builds use Angular's hashed script CSP. The build adds an exact configured Supabase
connection and media allowlist, with worker-src limited to self for the local compression worker; Vercel supplies frame, MIME, referrer and device-permission protections.
Static style permissions retain Angular component styles and the existing Google font/icon sources.
Feed tabs use standard keyboard behavior. Auth mode selectors are native pressed buttons.
Icon-only controls use translated accessible names. Decorative symbols are hidden from assistive technology.
Material Symbols Outlined is the icon family. Brand/usernames do not translate; UI text does.

Color changes use 180ms, offscreen chapter reveals use 550ms and disconnect their observers.
The trend ticker uses the theme's surface-alt background, text, border, primary label
and accent separators so it stays light in light mode and dark in dark mode. It has
a persistent pause button and stops on hover/focus. Reduced motion disables
animations, reveal movement and smooth scrolling. No real video asset was supplied; the video is a static preview.

### Account visibility and linked identity (22 October 2026)

Post dates appear below text/media, independently of the username. Native links on identity, text and date open /people/:id or /posts/:id; media playback controls keep their native behavior. Public profiles reuse ProfileHeader with an explicit readonly variant, real permitted posts and the existing follow actions. No new palette or layout width is introduced.
Account visibility reuses SocialPageFrame, Button and ConfirmDialog with a native five-option radio group. Explicit Save writes one audience level. Followers are retained at every level; Everyone includes all authenticated users. Department uses university + department IDs without campus; Campus uses university + campus IDs. Legacy is_private/visibility fields are neither queried for privacy nor written. Missing academic IDs disable their choices. Failed/uncertain saves preserve the draft and require a fresh read; navigation guards unsaved changes. Blocking overrides all audiences. Public Storage URLs remain outside row privacy.
The current implementation and confirmed SQL 19/20/22/23 status are tracked in docs/HESAP-VE-GONDERI-GUNCELLEMELERI-2026-10-22.md. Supabase public types are generated from the actual live schema, not a proposed extension.

Dashboard world news reuses the existing typography, surface/border/primary tokens, Button and Icon.
At 1024px and wider, a responsive 360–460px right rail sits beside the feed within the full-width dashboard;
its long expanded list has its own bounded native scroll. On narrower screens, the same component
becomes a collapsed disclosure below the sticky feed controls. Opening it preserves feed selection.
The news card uses the panel radius, a restrained primary-blue tint/border/static glow and
larger 15px headline text, following the user's X reference without changing global tokens.
The card initially shows four source-attributed headlines, expandable to eight, with full wrapping,
publication times, a last-checked timestamp and native external links. No fake trend counts or
article images are added. Existing welcome/auth layouts and the persistent left rail are unchanged.
The right column alone follows the supplied X reference: compact search first, then independent news
and department follow-suggestion cards, separated from the feed by a border and gutter. FormField's
sidebar-search variant retains its real accessible label/counter while displaying one rounded input;
all other fields keep their default appearance. FollowPerson's suggestion variant reuses the existing
actions and puts the follow button beside identity only when its container has enough space. No
premium/subscription, fake trend or popularity content from the reference is copied.

## Do's and Don'ts

Messaging uses the existing authenticated navigation shell and SocialPageFrame. InboxItem owns the
native conversation link with Avatar, preview, localized date and unread count. MessageBubble owns
plain text, localized time, a deleted-content placeholder and the existing ActionMenu. Incoming
bubbles use surface-alt/text; outgoing bubbles use primary/on-primary. All colors, focus states,
buttons, typography and borders map to existing tokens. The chat log is keyboard-scrollable and
keeps the reading position when earlier history loads; live additions follow the bottom only when
the reader is already there. FormField, Button and ConfirmDialog retain composer/draft/delete behavior.
MessagesStore is scoped to the messaging layout component; it clears sensitive rows and unsubscribes
on exit or identity replacement. Reconnect/token renewal never unlock an uncertain message receipt.

- Do put campus-specific expression in the poster and editorial chapter artwork.
- Do keep the same form validation, loading and actual-result feedback in every auth screen.
- Do source all owned copy, aria labels, placeholders and mock content from both dictionaries.
- Don't invent an authenticated session, OAuth result, sent email, real member count or legal policy.
- Don't reveal whether a particular email address already has an account in reset or sign-up feedback.
- Don't allow decorations to obscure fields or remove actions on narrow screens.

## 22 October live client contract update

The latest audience contract supersedes the earlier independent-switch and legacy-privacy descriptions: use one five-option radio group (Followers, Department, Campus, University, Everyone), preserve accepted followers at every level and leave actual visibility to RLS. Department matching does not require a campus. Missing campus/department IDs disable their choices. Academic feed scopes use IDs. No palette, typography or global layout tokens change.

Registration uses the shared AcademicPicker with a labelled native select and the established input styling. The operating system owns the option popup and keyboard/type-ahead behavior; free text is unavailable. AcademicService pages the approved catalog, scopes campuses/programs by university ID and cancels obsolete reads. Changing university clears both dependent values. Loading, empty and error/retry states are explicit. Campus coverage is partial; missing entries are not fabricated. SQL 30 validates the catalog relationship and versioned terms/privacy acceptance before signup, and records server-time receipts. Display-only shell services never enter shared UI. Username availability retains checking/available/taken/unavailable states; authenticated registration displays the server-assigned handle.

The repost trigger uses shared ActionSheet, which extends the canonical ModalDrawer with a bottom position and transform/opacity animation. Reduced motion is respected. Repost/Quote choices use native buttons and Arrow/Home/End navigation. Drawer focus returns before a choice opens the quote dialog. EmbeddedPost owns the readonly original preview and missing-original placeholder. ConfirmDialog supports a disabled positive confirmation for quote validation while retaining its existing destructive defaults. Original-only pins remain grouped under Featured posts; repost/quote cards have no pin action.

Post sharing opens the same bottom drawer, lists actual inbox recipients and sends only a post ID through the server RPC. A shared message loads its original through current RLS; an unavailable original becomes a localized placeholder. Ambiguous delivery disables repeat submission and links to the conversation. View totals come from the server; unavailable totals display an em dash. Visible cards record one authenticated account per post, excluding the author, after one second at half-card visibility in a visible tab. No viewer identity list is exposed. See docs/SOSYAL-YAYIN-2026-10-22.md for deployment and coverage limits.

Help Center uses SocialPageFrame and shared FormField/Button/ConfirmDialog/LegalDialog owners. Identity fields are readonly server-confirmed values; only the problem description is editable. It retains full-width form geometry, tokens, native document scrolling and TR/EN theme behavior. Readiness, pending delivery, status-only recovery and a separate support data-use notice are explicit. An uncertain request preserves its ID and description; verified retries reuse both. Draft navigation uses the shared discard dialog; sign-out clears the old view. No palette or typography changes.
