# Astro Rocket v2.6.0 alignment audit

This audit records the delta from the FireStone baseline to the upstream
`v2.6.0` tag (`d356f0e`). It is intentionally tag-scoped; upstream `main` is
not a migration source.

## Ported capabilities

- Durable content UIDs and build-time `PostLink` resolution.
- Native MDX YouTube facade, with click-to-load privacy playback and a
  no-JavaScript watch link.
- Responsive, collapsible table of contents with scroll spy and reduced-motion
  behavior.
- Project archive tag cloud/pagination, natural-ratio single media, optimized
  gallery posters, keyboard lightbox controls, and mixed image/video slides.
- `ProofTile`, `ProjectImageSVG`, configurable `BlogCta`, and configurable
  `NewsletterForm`; YouTube and ProofTile have component-library previews. Blog CTA and newsletter
  are disabled by default to preserve the FireStone layout.
- Favicon raster variants generated from the existing FireStone SVG, plus
  manifest/head references and bilingual UI strings.

## Deliberate boundaries

- FireStone page designs, Hero/WebGPU effects, Header/Footer/Search, consent
  behavior, static Cloudflare output, and existing content remain authoritative.
- Astro ClientRouter/View Transitions remains disabled, as the v2.6.0 release
  code documents its conflict with the theme's entrance effects on mobile.
- The upstream Docker preview/export files are not included, per project
  decision; deployment remains Cloudflare static output.
- Upstream demo-only Services/Contact views, alternate MarketingLayout, and
  API endpoints are not applicable to this static portfolio and remain absent.
- The existing i18n switch is preserved (enabled in this checkout). Page-body
  translations remain a separate follow-up. Shared chrome and fallback
  infrastructure are bilingual and use `zh-CN`/`en-US`.

## Already present or adapted equivalents

| Upstream release area | FireStone implementation / decision |
| --- | --- |
| 2.1 UI localization, Artalk, theme curation, brand-outline | Existing providers, locale dictionaries and theme list retained; Astro Button type now exposes the existing brand-outline implementation. |
| 2.2 durable links and collision validation | Existing `post-links.ts`, `content-validation.ts` and their tests retained; UIDs added to actual posts and shared MDX mapping expanded. |
| 2.3 automatic Footer columns | Configured FireStone groups win; the new fallback helper derives real links only, excluding placeholders with no detail route. |
| 2.3 blog CTA / Footer newsletter | Capabilities ported but disabled by default, per owner decision. Forms do not assume unavailable server endpoints. |
| 2.3 responsive media / TOC | Ported to the existing custom layouts; desktop sidebar-side configuration corrected and mobile details controls preserved. |
| 2.4 site-address agreement | Existing environment loading and `verify-site-url` build integration retained; canonical/JSON-LD verification runs during every build. |
| 2.4.1 LetterGlitch performance | Existing offscreen pause and parsed-color implementation already matches the release behavior. |
| 2.5 test enforcement / documentation guards | Existing CI and `validate` already execute tests; Actions were manually committed and are untouched. Added adapted README version/script and registry-file guards. Upstream tutorial fixtures are not copied because their demo articles are absent. |
| 2.5 Docker, including 2.5.2–2.5.3 fixes | Explicitly excluded by owner decision, not a missing port. |
| 2.6 Astro / MDX upgrade | Local Astro 7.3.1 and MDX 8.0.0 already match the tag; newer local dependencies and Expressive Code integration retained. |
| OG / logo / favicon | Keep custom logos and CJK font-outline sharing images; generate missing raster favicon variants from the real FireStone vector. Register only the media-aware SVG as the browser favicon: fixed PNG/ICO fallbacks can be selected by Cloudflare deployments and lose system dark/light adaptation. Raster generation must preserve alpha and must not flatten onto white. |
| Demo views and UI visual revisions | Preserve custom home/about/AI/SparkForge and card/Header/Footer designs. Thin shared views remain build-time rendering boundaries, not redirects. |
| ClientRouter | README claim conflicts with release implementation; follow the disabled release code, not the claim. |
| llms.txt | Existing navigation-derived links, routable projects and published posts retained. The internal component playground is intentionally noindex and is not added to the public content map. |

## Verification

`pnpm lint`, `pnpm check`, `pnpm test:run`, `pnpm build`, and the isolated
`pnpm test:i18n` browser run pass on the migration worktree. The latter
exercises UID links, YouTube activation/no-JS fallback, mixed galleries,
responsive TOC, generated favicon assets, and locale fallback routing.

The current suite contains 105 unit checks and 30 bilingual browser checks.
Astro reports zero errors/warnings and nine pre-existing deprecation hints.
YouTube tests block third-party traffic and verify facade/iframe behavior, not
real external playback. Gallery fixtures verify video markup/posters and
keyboard navigation; they do not claim codec/device playback coverage.
Lighthouse was not rerun and no new score is claimed. Test-owned preview
servers are stopped and temporary configuration/content restored.
