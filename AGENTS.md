# FireStone Website: Agent Guide

This file is the repository-level source of truth for coding work. Read it
before editing. `CLAUDE.md` only points here. User changes in the worktree are
valuable: inspect them, work with them, and do not reset or discard them.

## Project facts

- FireStone 火石 is a Chinese portfolio, project showcase, and technical blog.
- It is a customized Astro Rocket fork. The site is statically built and
  deployed to Cloudflare; the canonical site URL is `https://fire-stone.co/`.
- Stack: Astro 7.3, Tailwind CSS 4, TypeScript 6, React 19 islands, MDX,
  Pagefind, and pnpm. Node must satisfy `>=22.12.0`.
- The default locale is `zh-CN`. `src/config/i18n.config.ts` controls whether
  locale-aware routes are enabled. Preserve the configured switch during
  unrelated work. Missing translations use prefixed fallback routes; see
  `docs/locale-fallback.md`.
- The visual theme is defined by `src/styles/themes/firestone.css` and shared
  styles in `src/styles/global.css`.

## Useful commands

Run commands from the repository root with `pnpm`:

```text
pnpm dev             # local development server, usually http://localhost:4321
pnpm check           # Astro and TypeScript diagnostics
pnpm lint            # ESLint
pnpm test            # Vitest
pnpm test:run        # Vitest, one run without watch mode
pnpm test:i18n       # isolated bilingual build and browser checks; restores config
pnpm test:e2e        # Playwright
pnpm build           # production build plus Pagefind index
pnpm validate        # lint, check, unit tests, and build
pnpm format:check    # Prettier verification
```

Use the narrowest relevant command while iterating. For a meaningful route,
content, schema, or shared-component change, finish with `pnpm check` and
`pnpm build`; add lint/tests when the changed surface warrants them. A Pagefind
index exists after `pnpm build`, not during `pnpm dev`. Do not leave a server or
watch process running when the task is complete.

## How to work

1. Inspect the target route/component, its callers, related config, and nearby
   tests before deciding how to change it. Follow existing patterns and keep
   the diff focused.
2. Treat user intent and current code as higher priority than generic advice
   from a skill. Prefer Astro server/build-time code and existing components;
   add client JavaScript or a React island only when the interaction needs it.
3. Reuse the project's config, helpers, primitives, and tokens instead of
   creating parallel sources of truth. Preserve behavior that is not part of
   the request.
4. Make accessibility, keyboard focus, responsive layout, dark/light themes,
   and reduced motion part of the implementation when the surface is user
   facing. Verify the affected page at a mobile width when layout is involved.
5. Explain assumptions in the final response. Do not hide uncertainty by
   changing unrelated code or weakening types/checks.

Use `apply_patch` for hand edits. Add concise English comments when implementing
features to explain their purpose, configuration flow, and non-obvious decisions.
Match the style and frequency of nearby original-project and FireStone comments;
avoid narrating every line or restating obvious code. Do not print or commit values from `.env` or
other secrets. Do not push, publish, deploy, alter GitHub Actions, or create a
remote side effect unless the user explicitly requests it.

## Repository map and ownership

- `src/pages/`: file-based routes, including custom `/`, `/about`, `/ai`, and
  `/projects/sparkforge` pages, blog/project route families, legal pages, RSS,
  robots, and OG endpoints.
- `src/components/`: reusable Astro UI, layout, blog, project, hero, SEO, and
  effect components. `Header.astro`, `Footer.astro`, and `SearchModal.astro`
  are heavily customized; read them and their callers before changing markup.
- `src/layouts/`: base, landing, page, blog, project, and legal shells.
- `src/config/`: site identity and behavior (`site.config.ts`), navigation
  (`nav.config.ts`), locales (`i18n.config.ts`), and consent copy/policy.
- `src/content.config.ts`: Zod schemas for the `blog`, `projects`, `pages`,
  `authors`, `faqs`, and `stack` collections. Change schema and content
  together.
- `src/content/`: MD/MDX/JSON content. Blog and project entries are grouped
  by locale directories.
- `src/lib/`: content queries, URL/slug helpers, validation, and shared logic.
- `src/styles/`: global CSS, design tokens, and the FireStone theme.
- `src/__tests__/`: Vitest coverage for routing, URLs, translations, and
  content behavior.

## Invariants to preserve

### Content and publishing

- Production routes must exclude `draft: true`; development may show drafts so
  authors can preview them. Use the existing `getPublishedPosts`/
  `getVisibleProjects` helpers or the same `import.meta.env.PROD` condition.
- Blog and project tags share the slug contract in `src/lib/tags.ts`. Use
  `tagToSlug()` and `findTagBySlug()` for archives and links.
- A project with `soloPage: true` is rendered by its dedicated page (currently
  `src/pages/projects/sparkforge.astro`) and excluded from the generic
  `[slug].astro` route. Keep that exclusion when changing project routing.
- Use `localizedPath`, locale helpers, and the existing URL helpers for new
  shared links. Keep locale dictionaries structurally aligned when adding
  translation keys; a displayed translation key is a bug.

### Configuration and security

- Site-wide links, social URLs, labels, consent actions, and feature switches
  belong in their existing config files. `LegalLink` may contain an action such
  as `openConsentSettings`; do not turn action-only links into ordinary URLs.
- `astro.config.mjs` owns static output, integrations, env schema, and the
  build-time Pagefind hook. Do not change output mode or adapters casually.
- Consent is strict. Analytics/marketing code stays blocked until consent
  permits it. Use the existing consent trigger and `window.openConsentSettings`.
- Decorative effects are optional enhancements. They must fail soft, honor
  `prefers-reduced-motion`, and not block content or navigation. The global
  effect controller lives in `BaseLayout.astro`; do not duplicate its storage,
  hardware detection, or frame sampling in a component.

### UI conventions

- Prefer semantic theme tokens (`bg-background`, `text-foreground`,
  `border-border`) and existing `Button`, `Card`, `Badge`, `Dialog`, and
  `Icon` primitives. Reuse the interaction utilities in `global.css` when they
  match the behavior; do not add a second hover system without a reason.
- Keep controls keyboard reachable with an accessible name and visible focus.
  Avoid layout-shifting animations and respect reduced motion.
- Logos use the Chameleon/currentColor pattern. Inline SVGs need a `viewBox`;
  size classes belong on the SVG itself. Preserve the Header's secondary-logo
  and mobile crossfade behavior when touching its markup.
- For new visual work, use the established FireStone direction unless the task
  asks for a redesign. A design skill is advice, not a requirement to invent a
  new palette, hero, card system, or animation.

## Upgrades and high-risk changes

Read `UPGRADE.md` before an Astro Rocket merge or dependency upgrade. It is a
specialized playbook, not a reason to apply merge rules to ordinary feature
work. Upgrade deliberately, preserve FireStone routes/components, inspect
conflicts manually, and run the documented checks. Do not independently make
major ESLint, TypeScript, Astro, or adapter upgrades without an explicit task.

For changes to shared layouts, routing, content schemas, i18n, consent,
effects, or build configuration, broaden verification and inspect generated
routes/output as appropriate. When a check fails, fix the cause or report the
concrete blocker; do not silence it by weakening validation.

## Skill use

Invoke a skill only when its subject materially helps the current task. Start
from repository evidence and this guide. In particular:

- Astro guidance is useful for unfamiliar Astro APIs; prefer this project's
  `pnpm` scripts and static-output configuration over generic adapter examples.
- Frontend-design guidance is useful for a genuinely new or redesigned page;
  it must not override existing FireStone components or force a planning ritual.

The goal of this file is to provide accurate constraints without replacing
engineering judgment. When a rule and the code disagree, verify the code,
state the discrepancy, and update the smallest necessary surface.
