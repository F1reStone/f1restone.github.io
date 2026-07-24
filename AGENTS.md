# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Astro dev server at `http://localhost:4321` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm check` | Run `astro check` (type-checking) |
| `pnpm lint` | ESLint across the project |
| `pnpm lint:fix` | ESLint with auto-fix |
| `pnpm format` | Prettier — format all files |
| `pnpm format:check` | Prettier — check only |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm validate` | Full pipeline: lint + type-check + build |

**Node requirement**: ≥22.12.0 (Astro 6 enforces this).

## Project Identity

This is **FireStone 火石** — a personal portfolio/tech blog/project showcase for a Chinese developer/designer. It's a fork of [Astro Rocket](https://github.com/hansmartensdev/astro-rocket) (2.0.0), heavily customized.

- **URL**: `https://fire-stone.co/`
- **Default locale**: `zh-CN`, will added `en-US` and `zh-TW` in future, so needed i18n ready
- **Deployment**: GitHub Pages (static output), no Vercel/Netlify adapter active
- **Theme**: Custom `firestone` theme (`src/styles/themes/firestone.css`) — deep near-black dark mode with a purple-tinted brand scale (hue ~289°)
- **Brand colors**: Purple (`#7832FF`), Cyan (`#00C3FF`), Pink (`#FD579C`)

## Architecture

- **Framework**: Astro 7 + Tailwind CSS 4 + TypeScript v5.9 + React
- **Package manager**: pnpm
- **Islands**: Mostly static (zero JS by default), React islands where needed (e.g. `TerminalDemo`)
- **Content**: Astro Content Layer API with `glob` loaders — 6 collections: `blog`, `pages`, `projects`, `authors`, `faqs`, `stack`
- **Config SSOT**: All site configuration lives in `src/config/` — `site.config.ts`, `nav.config.ts`, `i18n.config.ts`, `consent.config.ts`
- **i18n**: Opt-in native Astro i18n. Currently enabled with only `zh-CN` as the active locale (others in `localeNames` are pre-registered for future use). Routes stay at root (`/about` not `/zh-CN/about`).

### Key Directories

```
src/
├── config/          # SSOT — site, nav, i18n, consent configuration
├── content/         # MDX/MD/JSON content (blog, projects, pages, faqs, stack, authors)
├── pages/           # File-based routes + API endpoints
├── components/
│   ├── ui/          # UI primitives (Button, Card, Badge, etc.) — barrel-exported
│   ├── blog/        # Blog-specific: ArticleHero, BlogCard, TableOfContents, etc.
│   ├── projects/    # Project-specific: ProjectHero, ProjectCard, ProjectCarousel, ProjectGallery
│   ├── layout/      # Header, Footer, ThemeToggle, SearchModal, Analytics
│   ├── effects/     # Visual effects: CursorTrail, HeroBeam, HeroGrid
│   ├── patterns/    # Composed: ContactForm, LetterGlitchBand, StatCard, etc.
│   ├── landing/     # Homepage sections: CTA, Credibility, TechStack, StackMarquee
│   ├── hero/        # Hero component (centered/split layouts)
│   └── seo/         # SEO, JsonLd, Breadcrumbs
├── layouts/         # BaseLayout, BlogLayout, PageLayout, ProjectLayout, LegalLayout, etc.
├── lib/             # Utilities: blog.ts, projects.ts, tags.ts, gallery.ts, utils.ts, cn.ts, etc.
├── styles/
│   ├── global.css   # Tailwind @theme + animations + global styles
│   ├── tokens/      # Design tokens (colors, typography, spacing, primitives)
│   └── themes/      # 13 theme files including custom `firestone.css`
└── assets/          # Images, icons, AI logo, project screenshots
```

## FireStone Customizations (vs upstream Astro Rocket)

### Custom Pages
- **`/ai`** (`src/pages/ai.astro`) — FireStone AI WIP page with "Coming Soon" hero
- **`/services`** (`src/pages/services.astro`) — Services page, unused
- **`/projects/sparkforge`** (`src/pages/projects/sparkforge.astro`) — Custom solo project page with full layout control

### Solo Project Page Pattern
A project can set `soloPage: true` in its MDX frontmatter. This causes the generic `[slug].astro` route to skip it, and a dedicated `.astro` file at `src/pages/projects/<slug>.astro` takes over. The solo page imports the MDX via `getEntry()` + `render()` and has full control over the page chrome. Use this for heavily customized project layouts.

### Secondary Logo in Header
The `Header` component accepts `secondaryLogoSvg` (an inline SVG string with `viewBox` only, no `width`/`height`) and `secondaryLogoHref`. When provided, the header renders a secondary logo alongside the main site logo — used for project branding (e.g., SparkForge).

### Cookie Consent
Custom Chinese-text consent banner (`src/config/consent.config.ts`), `strict` mode (scripts fully blocked until consent). Triggered from footer legal links via `#consent-settings` anchor.

### Footer Architecture
Uses `footerLinkGroups` — 4 columns: 探索, 项目, 关于, Powered by. Configured in `nav.config.ts` via `getFooterLinkGroups()`.

### Social Links
Custom Chinese-platform mix: GitHub, Bilibili, Zhihu, NetEase Cloud Music, YouTube, X (Twitter). Parsed by regex in `utils.ts` to extract platform-specific icons.

### Custom Font Stack
FireStone theme overrides `--theme-font-sans`, `--theme-font-display`, `--theme-font-mono` with a rich CJK fallback chain (`Noto Sans SC` → `PingFang SC` → `HarmonyOS Sans SC` → `Microsoft YaHei UI`). Variable fonts for Latin text (Sans: Wix Madefor Text, Display: Neue Regrade, Monospace: NKDuy Mono).

## Architectural Golden Rules

1. **SSOT**: Nav links, footer links, social links, i18n settings MUST be centralized in `src/config/`. Components map from configs dynamically — never hardcode duplicate lists.
2. **Maintainability**: Styles belong in CSS component classes, not inline in HTML. No empty `div`s for decoration.
3. **GPU Acceleration**: Animations (cursor, carousels, WebGL) use `transform: translate3d` or `translateZ(0)` — never animate layout-affecting properties.
4. **Layout Thrashing Prevention**: Variable font weight changes on hover use invisible `::after` pseudo-elements to lock physical width. Animated flex gaps use absolute positioning and explicit pixel math.
5. **Variable Scoping**: Use CSS custom property overrides for dark/light and immersive states. Avoid chaining Tailwind utility classes for state changes.
6. **Logo is a Chameleon**: `Logo.astro` has no hardcoded dark/light logic. It uses `fill="currentColor"` and inherits from parent. Parents control it by passing `text-foreground` or via CSS custom property reassignment.

## Key Patterns

### Content queries with draft filtering
```astro
---
import { getCollection } from 'astro:content';
const posts = await getCollection('blog', ({ data }) => {
  return import.meta.env.PROD ? !data.draft : true;
});
---
```

### Tag system
Tags are shared across blog and projects. `lib/tags.ts` provides `tagToSlug()` and `findTagBySlug()` — use these for consistent URL-safe slugs. Tag archives live at `/blog/tag/[tag]` and `/projects/tag/[tag]`.

### Project system
Projects are MDX files in `src/content/projects/`. Each has `order` (sorting), `featured` (homepage visibility), `gallery` (carousel), `soloPage` (custom page), and `tags`. The listing at `/projects` mirrors the blog pagination pattern.

### Upstream merges

This repo receives periodic merges from the upstream [Astro Rocket](https://github.com/hansmartensdev/astro-rocket) theme. When a user asks to merge/upgrade from upstream:

1. **READ `UPGRADE.md` FIRST** — it contains the complete merge playbook: file classification rules (A/B/C/D/E), conflict resolution strategies, i18n merge patterns, build verification checklist, common pitfalls with specific fixes, FireStone code style conventions, and quick-reference commands.
2. Create a backup branch before starting.
3. Run `npx @astrojs/upgrade` then `pnpm up` (no major version bumps for eslint/typescript unless upstream did).
4. Classify every changed file per the A/B/C/D/E system in UPGRADE.md — never blindly accept one side.
5. After resolving conflicts, audit auto-merged files with `git diff backup-before-astroX-upgrade HEAD -- <file>` to catch silent overwrites.
6. Run the full build verification checklist before committing.

When updating deps or patterns, prefer alignment with upstream to ease future merges — only diverge when the customization is intentional and documented.
