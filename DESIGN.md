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
  page-max: '1320px'
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
social features remain previews and Google OAuth is not connected. A remembered session uses
persistent browser storage; an unremembered session uses session storage.
Audience evidence: the supplied KampusX-welcome-spec2.md and the user's Angular/Nx request.
Turkish and English are equally supported. Browser language sets the initial locale;
the explicit language choice overrides it and survives reloads.

Avoid a generic dashboard card grid as the page's overall composition. The community
directory is deliberately a consistent card grid because its items are comparable.
Do not add invented legal policy: the legal dialog states that the legal documents are not yet
published and describes the authentication data flow without presenting a placeholder as a policy.

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

The document owns vertical scrolling. The maximum width is 1320px with 40px desktop gutters,
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
Organisms own post/community previews, marquee, and legal preview dialog.
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
The authenticated `/dashboard` route uses a centered campus feed shell, with existing logo,
language and theme controls. It consumes the canonical tokens without changing them or the
theme services. Shared Avatar, TabStrip, FeedSkeleton and ModalDrawer own its reusable UI.
The left profile drawer follows the native-dialog modal contract: background isolation,
scroll lock, focus trap/return, Escape, backdrop click and left-swipe dismissal. Its header
contains the signed-in user's display name, handle, university, department and real, nullable follow counts. Profile metadata is
display content only; missing university/department values use honest localized placeholders.
The drawer's sign-out control closes the real Supabase session. Discovery uses a single selected index
for tab clicks, Arrow/Home/End keys and horizontal touch swipes. Vertical document scrolling
remains native; the bottom navigation reserves safe-area space. Motion is transform/opacity
only and honors reduced motion. Skeletons are static decoration only for the three planned academic feeds;
Explore uses real rows with loading, error/retry and empty states. Profile menu and bottom navigation are explicitly unavailable
visual items with no navigation or network effects, except the active Profile entry and profile-page Home action. Email/password sign-in redirects to dashboard
only after Supabase returns a session; registration with no session keeps email-verification guidance.
The dashboard guard verifies the session with Supabase getUser; valid signed-in users skip login/register,
and password recovery keeps its own route. Session loss returns to login. The existing auth forms keep
their visual design and welcome keeps its public chrome. Plain login URLs are not treated as callback
links; callback detection requires actual auth parameters. Explore reads authenticated public.posts rows. No fake session is created by dashboard.
University, campus and department filtering remains a planned visual flow because no scope columns were supplied.
The lazy `/profile` and `/profile/edit` routes retain the existing session guard. ProfileService
seeds display identity from the existing session. Names and bios persist in allowlisted Auth display metadata;
follow counts come from public.user_follows after the separately applied 07 SQL setup. A missing table or failed read shows an unknown count and Retry, never an invented zero. The joined date remains illustrative. Avatar/banner URLs persist in public.profiles by user_id;
posts and post count come from public.posts. No reply/repost data is invented.
It owns atomic name/bio/photo updates and staged object URLs, releases discarded/replaced assets,
and resets its local state when the signed-in account changes. University and department can be edited in the same
profile form (required, max 150 characters each) and persist as university_name/department_name in existing Auth
user metadata. They are self-declared display information, never school verification or authorization. Username
and faculty stay readonly. An academic save updates the profile/drawer immediately and survives a reload.
Auth metadata and photo rows cannot form one transaction; partial saves report which information was retained.
Registration requires name, username, university, faculty/school and department; bio is optional (160 characters). It sends only allowlisted display metadata to Auth; it does not grant roles. Faculty is captured as faculty_name at registration and stays readonly in the editor. The field order in both flows is name, username, bio, university, faculty, department. Email, password and consent follow those registration fields. Required fields are enforced by the registration form; metadata remains user-editable display content, not a verified academic credential.
Upload ownership and a session epoch are checked across asynchronous boundaries. Logout or replacement login
invalidates pending work, including a re-login to the same user; token refresh alone does not. Dirty profile/post
editors leave on session loss without trapping the user in a discard dialog or retaining the old draft.
ProfileRepository snapshots only avatar_url/banner_url and validates their owner and purpose at runtime;
TypeScript payload types are not treated as a security boundary. Media URLs accept only canonical
uid/area/safe-filename paths and the supported image/video extensions in the configured bucket. PNG, JPEG
and WebP dimensions are checked before decoding, with browser decoding and a final pixel-limit check.
Avatar, scrollable TabStrip and floating FormField extend existing owners through optional variants.
FollowsService owns exact HEAD counts, an authenticated private Broadcast channel per user, debounced refetch on change, reconnect refetch and session-bound teardown. The shared FollowCounts molecule owns number/unknown/error/retry presentation in profile and drawer. The approved SQL creates only user_follows, participant-only SELECT, follower-only INSERT/DELETE, no self/duplicate follows, and private empty invalidation events for both participants. Restrictive reserved-topic policies prevent unrelated permissive policies from exposing these topics or accepting forged client events. The service exposes session-verified setFollowing for later people/profile entry points; a user directory and follow buttons are outside the existing own-profile route.
SocialPostCard owns feed cards; the marketing PostCardPreview remains its separate existing preview.
ImagePicker owns native file selection and staged previews, ConfirmDialog owns draft-discard confirmation,
and Toast with NoticeService owns saved feedback across route changes. MediaService owns real uploads to the existing public uploads bucket; ProfileRepository and PostsService own the DB boundary.
File selection only stages previews; Save/Publish performs network writes. URLs use uid/purpose/random paths and only
the configured bucket origin is rendered. Confirmed uploads can be reused after a rejected DB write.
Storage and database writes are separate operations; no speculative deletion of possibly referenced objects occurs.
Storage failures distinguish session, denied access, unavailable bucket, bucket limits, throttling and network failures
without exposing raw server responses. Failed uploads preserve the draft and never insert a post.
Post composer uses existing FormField/Button/ConfirmDialog owners and the same protected navigation/draft contract.
Ambiguous publication outcomes block blind retries. Only confirmed success triggers the shared toast and feed navigation.
A post is at most 2000 characters with one optional image/video; images accept JPG/PNG/WEBP,
up to 5 MiB and 32 megapixels, with decoded-content checks; videos accept MP4/WEBM up to 50 MiB
with signature and metadata decode checks. Public-file visibility remains disclosed in the post composer. Profile images are decoded locally (input at most 20 MiB / 32 megapixels), scaled without upscaling to 640×640 for avatars and 1920×1080 for banners, and encoded as WebP at at most 1 MiB when resizing/compression is needed; already-small originals are retained. The existing upload service revalidates the result. Bitmap/canvas resources are released and pending work cannot cross sessions. Profile and media geometry stays reserved.
The profile uses a 3:1 cover, an overlapping 96px avatar, a 64px sticky toolbar and sticky scrolling tabs.
IntersectionObserver controls only opacity/transform header motion and is disconnected on teardown.
The editor uses equal left/right action columns (Cancel and Save), with a centered single-line title, including 320px phones. Account information heads the fields. It blocks duplicate saves. Profile ImagePicker removes files through a translucent centered X revealed on hover or keyboard focus; coarse/touch pointers keep the action visible. The avatar camera stays at the lower-right edge. Informational format/size and account/public-file disclaimers are omitted from the editor by the user’s explicit request; actionable validation errors remain.
Dirty route departures use the native shared confirmation dialog, Escape keeps edits, focus returns,
and saved changes update the drawer and every own post card through the same signal.
Production builds use Angular's hashed script CSP. The build adds an exact configured Supabase
connection and media allowlist; Vercel supplies frame, MIME, referrer and device-permission protections.
Static style permissions retain Angular component styles and the existing Google font/icon sources.
Feed tabs use standard keyboard behavior. Auth mode selectors are native pressed buttons.
Icon-only controls use translated accessible names. Decorative symbols are hidden from assistive technology.
Material Symbols Outlined is the icon family. Brand/usernames do not translate; UI text does.

Color changes use 180ms, offscreen chapter reveals use 550ms and disconnect their observers.
The trend ticker uses the theme's surface-alt background, text, border, primary label
and accent separators so it stays light in light mode and dark in dark mode. It has
a persistent pause button and stops on hover/focus. Reduced motion disables
animations, reveal movement and smooth scrolling. No real video asset was supplied; the video is a static preview.

## Do's and Don'ts

- Do put campus-specific expression in the poster and editorial chapter artwork.
- Do keep the same form validation, loading and actual-result feedback in every auth screen.
- Do source all owned copy, aria labels, placeholders and mock content from both dictionaries.
- Don't invent an authenticated session, OAuth result, sent email, real member count or legal policy.
- Don't reveal whether a particular email address already has an account in reset or sign-up feedback.
- Don't allow decorations to obscure fields or remove actions on narrow screens.
