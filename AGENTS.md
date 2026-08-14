# FireStone Website Agent Guide

This document is the authoritative guide for every coding agent working in this
repository. Read it before changing code. `CLAUDE.md` is intentionally only a
pointer here so project rules cannot drift between tools.

## Project Identity

**FireStone 火石** is a Chinese personal portfolio, project showcase, and
technical blog for FireStone. It is a heavily customized fork of
[Astro Rocket](https://github.com/hansmartensdev/astro-rocket), deployed as a
static site to GitHub Pages.

- Production URL: `https://fire-stone.co/`
- Package manager: `pnpm`
- Framework: Astro `7.1.3`
- UI: Tailwind CSS `4.3`, Astro components, and React islands where needed
- Language: TypeScript `6.0.3`
- Required Node version: `>=22.12.0`
- Default locale: `zh-CN`
- Theme: `firestone` in `src/styles/themes/firestone.css`
- Brand accent: purple, with cyan and pink reserved for visual effects

The site is primarily static. Do not introduce client-side JavaScript or a
React island for a feature that an Astro component and small progressive script
can handle.

## Commands

| Command             | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm dev`          | Run the Astro development server at `http://localhost:4321`        |
| `pnpm build`        | Create a production build in `dist/`, including the Pagefind index |
| `pnpm preview`      | Serve the production build locally                                 |
| `pnpm check`        | Run Astro and TypeScript checks                                    |
| `pnpm lint`         | Run ESLint                                                         |
| `pnpm lint:fix`     | Run ESLint with fixes                                              |
| `pnpm format`       | Format with Prettier                                               |
| `pnpm format:check` | Verify formatting                                                  |
| `pnpm test`         | Run Vitest                                                         |
| `pnpm test:e2e`     | Run Playwright E2E tests                                           |
| `pnpm validate`     | Run lint, check, and build                                         |

Use `pnpm`, not npm or yarn. Run the narrowest relevant verification while
working, then run `pnpm check` and `pnpm build` before declaring a substantial
change complete. Search works only after a production build: use
`pnpm build && pnpm preview` to test Pagefind results locally.

Do not push, release, or modify GitHub Actions unless the user explicitly asks.
The repository may contain user changes; preserve them and do not use destructive
Git commands to make the worktree look clean.

## Repository Map

```text
src/
├── assets/          # Project, AI, branding, and content assets
├── components/
│   ├── blog/        # Article, tag, TOC, card, share, and comment UI
│   ├── effects/     # Cursor and decorative effects
│   ├── hero/        # Reusable Hero layouts
│   ├── landing/     # Home-page sections
│   ├── layout/      # Header, Footer, search, language/theme controls
│   ├── patterns/    # Composed content blocks and forms
│   ├── projects/    # Project cards, hero, carousel, gallery, and views
│   ├── seo/         # Metadata, JSON-LD, breadcrumbs
│   └── ui/          # Reusable primitives, form controls, overlays, marketing
├── config/          # Site-wide single sources of truth
├── content/         # MDX/MD/JSON content collections
├── i18n/            # Locale dictionaries and i18n helpers
├── layouts/         # Page, blog, project, legal, and base layouts
├── lib/             # Content, tag, URL, gallery, and utility functions
├── pages/           # File-based routes and API-style static endpoints
└── styles/
    ├── global.css   # Tailwind theme, shared interaction engine, global effects
    ├── tokens/      # Base tokens
    └── themes/      # Theme implementations; FireStone uses firestone.css
```

Important root files:

- `astro.config.mjs`: static Astro configuration, integrations, Pagefind hook,
  environment schema, and opt-in native i18n wiring.
- `src/content.config.ts`: Content Layer schemas. Change schemas and content
  together when adding frontmatter.
- `src/config/site.config.ts`: site identity, structured-data inputs, article,
  project, and effect switches.
- `src/config/nav.config.ts`: header links, footer link groups, legal links,
  icon/action metadata, and i18n-aware URL resolution.
- `src/config/i18n.config.ts`: locale inventory and the native i18n switch.
- `src/config/consent.config.ts`: Chinese Cookie consent copy and strict-mode
  category policy.
- `UPGRADE.md`: mandatory playbook for upstream Astro Rocket merges.

## Single Sources of Truth

Do not hardcode a second copy of site-wide data in a component.

- Header and footer links: `src/config/nav.config.ts`
- Social URLs: `siteConfig.socialLinks` in `src/config/site.config.ts`
- Site name, description, brand metadata, article and project settings:
  `src/config/site.config.ts`
- Locale list and display names: `src/config/i18n.config.ts`
- Cookie categories and text: `src/config/consent.config.ts`
- Tags and tag URLs: `src/lib/tags.ts`

`LegalLink` supports `icon` and `action`. Preserve both when changing footer
link resolution: `openConsentSettings` is an action-only link and must not be
reduced to a plain URL.

## Content and Routing

The project uses Astro Content Layer collections with `glob` loaders:

- `blog`: MD/MDX articles, including tags, dates, draft state, optional FAQ,
  TOC/comment overrides, and locale.
- `projects`: MD/MDX projects, including gallery, tags, metadata, `soloPage`,
  optional logo, and locale.
- `pages`, `authors`, `faqs`, and `stack`: supporting content collections.

### Draft filtering

Content queries must preserve the production draft filter:

```ts
const entries = await getCollection('blog', ({ data }) =>
  import.meta.env.PROD ? !data.draft : true
);
```

### Tags

Blog and project tags share the same slug system. Always use `tagToSlug()` and
`findTagBySlug()` from `src/lib/tags.ts`; do not create route slugs with ad hoc
string manipulation. Tag archives are under `/blog/tag/[tag]` and
`/projects/tag/[tag]`.

### Solo project pages

Set `soloPage: true` in a project MDX file when it needs a dedicated page at
`src/pages/projects/<slug>.astro`. The generic `[slug].astro` route excludes
these entries. The standalone page must query the matching entry with
`getEntry()` and render its MDX itself. Keep this exclusion intact whenever the
project route or schema changes.

### Existing custom routes

The following are intentional FireStone pages and must not be overwritten by a
theme default:

- `/` (`src/pages/index.astro`)
- `/about` (`src/pages/about.astro`)
- `/ai` (`src/pages/ai.astro`)
- `/projects/sparkforge` (`src/pages/projects/sparkforge.astro`)
- Blog, project, legal, OG-image, RSS, and locale-aware route families

`/services` and `/contact` are not active site pages. Do not restore them from
upstream merely because the theme has them.

## Internationalization

The codebase is ready for native Astro i18n, but it is currently **disabled**:

- `defaultLocale` is `zh-CN`.
- `zh-CN`, `en-US`, and `zh-TW` are registered in configuration and accepted by
  content schemas.
- Astro routes stay unprefixed while `enabled: false`.
- `LanguageSwitcher` and alternate links activate only when i18n is enabled
  and more than one locale is configured.

Use `t()`, `tData()`, `localizedPath()`, and locale helpers from `@/i18n` for
new shared navigation, metadata, or reusable UI. Keep the dictionary shape in
each locale aligned with `src/i18n/zh-CN.json`. A missing translation falls back
to the default dictionary and then displays its key, which is a visible defect.

When adding a locale, update all of these together:

1. `src/config/i18n.config.ts`
2. `src/i18n/<locale>.json`
3. localized content files and frontmatter
4. route `getStaticPaths()` behavior and language alternates
5. relevant unit tests in `src/__tests__/`

## Logos and Branding

Use the **Chameleon** logo pattern. The main `Logo.astro` and preferred project
logos are inline SVGs using `fill="currentColor"`; their parent supplies
`text-foreground` or another semantic color. Do not add dark/light filter hacks
to a Chameleon logo.

For a Header secondary logo:

1. Import an SVG with `?raw`.
2. Remove intrinsic `width` and `height` attributes.
3. Add size classes to the root `<svg>`, not only to its wrapper.
4. Pass the resulting string as `secondaryLogoSvg`, plus `secondaryLogoHref`
   when it should be a link.

The SVG requires a `viewBox` and `currentColor` fills. The legacy
`secondaryLogo: ImageMetadata` path remains only as a compatibility fallback.

Project frontmatter accepts `logo`. Generic pages render it through
`ProjectHero`; solo pages control their own logo layout. Keep size classes on
the inline SVG itself, using explicit heights rather than `h-auto`, which can
collapse an inline SVG without intrinsic dimensions.

## UI and Style Rules

### Style layering

Use the least complex implementation that fits:

1. Tailwind utilities for layout, spacing, typography, colors, borders, and
   ordinary responsive behavior.
2. Shared utility/component classes in `src/styles/global.css` for reusable
   non-trivial material, glow, variable-font, or interaction behavior.
3. Scoped component CSS for effects unique to a component or route.

Do not move simple static CSS into a global class. Conversely, do not duplicate
a complex interaction effect in many components when the shared engine already
models it.

### SparkFlow interaction engine

The shared engine lives at the end of `src/styles/global.css`. Reuse it instead
of rebuilding hover behavior:

| Class                       | Use                                                     |
| --------------------------- | ------------------------------------------------------- |
| `glass-panel`               | Translucent liquid-glass surface                        |
| `hover-solid-fill`          | Foreground solid fill on interactive hover/focus        |
| `hover-glow-box`            | Raised rectangular/circular surface with glow and scale |
| `hover-glow-outline`        | Glass/outline glow without solid fill                   |
| `hover-glow-icon`           | Icon-only color, drop-shadow, and scale behavior        |
| `hover-glow-text`           | Text-shadow glow only                                   |
| `weight-shift`              | Center-aligned variable-font weight transition          |
| `weight-shift-non-centered` | Left-aligned variable-font weight transition            |

`weight-shift` and `weight-shift-non-centered` require `data-text` containing
the visible text. Their hidden `::after` pseudo-element reserves the maximum
weight width and prevents layout shift. Apply `hover-glow-text` separately when
text should also glow. Do not apply a weight-shift class to a flex button whose
icon/text geometry would be affected; use text glow only.

The engine centralizes its transition list in `--engine-transition`, uses
GPU-friendly `transform` and `filter`, and has a reduced-motion fallback. Keep
new interactions compatible with `prefers-reduced-motion`; do not animate
layout-affecting properties such as `width`, `height`, `top`, or flex gaps.

`hdr-logo-glow` is intentionally retained as a specialized Logo treatment.
Header navigation and mobile logo crossfade also have component-specific logic;
do not replace them with generic classes without checking all header states.

### Buttons, cards, dialogs, and inputs

- Use the shared `Button` component and its CVA variants when possible.
  Button variants already compose the interaction engine.
- New button-like elements must remain keyboard focusable, have an accessible
  name, use the global pointer cursor behavior, and retain visible focus rings.
- Use `Card` and `Badge` primitives rather than recreating their baseline
  visual treatment.
- `Dialog.astro` and `Dialog.tsx` define the modal baseline. Search is a
  command-palette variant, but should keep Dialog-compatible backdrop, focus,
  animation, and scroll-restoration behavior.
- The Header and Footer are highly customized. Preserve responsive behavior,
  accessibility, i18n inputs, secondary logo support, Cookie settings action,
  and the CSS-only mobile logo crossfade before changing their markup.

### Theme and accessibility

Use semantic tokens (`text-foreground`, `bg-background`, `border-border`,
etc.) and values defined by `firestone.css`. Avoid hardcoded black/white for
theme-aware UI. Brand colors may be used deliberately for content accents and
the footer aurora.

Respect light mode, dark mode, keyboard focus, screen-reader names, and
`prefers-reduced-motion`. Test mobile widths when changing Header, footer,
dialogs, or carousels.

## Search, Consent, and Effects

- Search is Pagefind. `astro dev` does not build an index, and the UI should
  explain that gracefully rather than treating it as a runtime error.
- Cookie consent runs in `strict` mode. Analytics and marketing scripts must
  remain blocked until consent permits them. Footer actions open preferences
  through `[data-consent-settings-trigger]` and `window.openConsentSettings`.
- Decorative effects such as cursor trails, reveal observers, Hero beams, and
  footer aurora are optional enhancement. They must degrade without breaking
  content or navigation and respect reduced motion where applicable.

## Component Conventions

Astro components should normally follow this shape:

```astro
---
import { cn } from '@/lib/cn';

interface Props {
  title: string;
  class?: string;
}

const { title, class: className } = Astro.props;
---

<section class={cn('base Tailwind classes', className)}>
  {title}
</section>
```

Use `class:list` or `cn()` for conditional classes. Keep complex client-side
code scoped, idempotent across Astro navigation/lifecycle events, and guarded
against duplicate listener registration. Prefer existing icon mappings in
`Icon.astro`; when adding a social service, update its mapping rather than
embedding raw SVG in every caller.

## Upstream Theme Upgrades

Read **`UPGRADE.md` before doing any upstream merge or dependency upgrade**.
It contains the full A/B/C/D/E classification workflow, merge commands,
i18n integration patterns, known Astro merge pitfalls, and verification list.

At a minimum:

1. Create a backup branch before modifying dependencies or merging upstream.
2. Run `npx @astrojs/upgrade` first, then carefully update compatible packages
   with pnpm.
3. Do not independently take a major ESLint or TypeScript upgrade unless the
   upstream version also requires it or the user approves it.
4. Preserve FireStone pages and customized components, then selectively merge
   upstream functionality such as i18n, routing, SEO, and accessibility.
5. Retain upstream new components/routes unless they conflict with an existing
   implementation; identify the conflict before discarding a feature.
6. Audit auto-merged files against the backup branch for silent design loss.
7. Run `pnpm check`, `pnpm build`, and relevant local visual tests before
   committing. Do not push without explicit approval.

During an upgrade, never blindly choose “ours” or “theirs” for every conflict.
Particularly audit Header, Footer, SearchModal, ArticleHero, ProjectHero,
BlogLayout, ProjectLayout, tag UI, i18n dictionaries, icon maps, project routes,
and custom standalone pages.

## Final Verification

For meaningful UI, route, content-schema, or interaction changes, verify:

1. `pnpm check`
2. `pnpm build`
3. Relevant lint/test commands when the changed surface has coverage
4. Local pages affected by the change, in dark and light modes where relevant
5. Mobile behavior for Header, dialogs, logo combinations, and responsive grids

Before finishing, report the files changed, checks run, anything intentionally
left unchanged, and whether work was committed or pushed. Unless explicitly
requested, leave the changes local and do not create a remote side effect.
