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
Forms stay familiar and quiet. Demo behavior is explained next to the form and in its result,
without preview labels in the campaign header or footer.

This is a hybrid surface: the welcome route is marketing; the auth panel and `/auth/*`
routes use shared product form controls. There is no backend, session, tracking, or OAuth connection.
Audience evidence: the supplied KampusX-welcome-spec2.md and the user's Angular/Nx request.
Turkish and English are equally supported. Browser language sets the initial locale;
the explicit language choice overrides it and survives reloads.

Avoid a generic dashboard card grid as the page's overall composition. The community
directory is deliberately a consistent card grid because its items are comparable.
Do not add invented legal policy: the legal dialog explains the preview's actual behavior.

## Colors

Canonical runtime ownership is **Model B**: `libs/shared/design-tokens/tokens.css` owns values.
This document mirrors the accepted light values and explains intent. The CSS defines both
themes; Tailwind's preset references the variables, never independent copies of raw values.

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
No auth values are stored. Passwords support password managers, paste and accessible reveal controls.

The legal dialog uses native modal dialog behavior: focus isolation, Escape dismissal and focus return.
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
- Do keep the same form validation, loading and demo confirmation behavior in every auth screen.
- Do source all owned copy, aria labels, placeholders and mock content from both dictionaries.
- Don't invent an authenticated session, OAuth result, sent email, real member count or legal policy.
- Don't allow decorations to obscure fields or remove actions on narrow screens.
