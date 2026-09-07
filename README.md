# FireStone Website
FireStone's personal website built on [Astro Rocket](https://astrorocket.dev/), prioritizes visual appeal and interactive experience.

<p align="left">
  <a href="https://github.com/f1restone/f1restone.github.io/actions/workflows/deploy.yml"><img src="https://github.com/f1restone/f1restone.github.io/actions/workflows/deploy.yml/badge.svg?branch=main" alt="CI and deploy" /></a>
  <a href="https://astro.build"><img src="https://img.shields.io/badge/Astro-7.3-bc52ee?logo=astro&style=for-the-badge&logoColor=white" alt="Astro 7.3" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61dafb?logo=react&style=for-the-badge&logoColor=white" alt="React 19" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4.3-38bdf8?logo=tailwindcss&style=for-the-badge&logoColor=white" alt="Tailwind CSS 4.3" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&style=for-the-badge&logoColor=white" alt="TypeScript 6.0" /></a>
</p>

---

Upgrade decisions and testing: [2.6.0 migration](docs/upgrade-as260.md), [upgrade and verification guide](UPGRADE.md).

Use Node.js 24 LTS (`.nvmrc`) and the pnpm version pinned in `package.json`.
`pnpm validate` runs lint, type checking and unit tests before building. CI also
runs production and bilingual browser checks; only a successful push to `main`
deploys to Cloudflare. See [CI operation and maintenance](docs/ci.md).

Powered by:
- [Astro](https://astro.build/)
- [Astro Rocket](https://astrorocket.dev/)
- [Cloudflare](https://cloudflare.com/)
- [Google Fonts](https://fonts.google.com/)
- [Lucide](https://lucide.dev/)
- [React](https://react.dev/)
- [Simple Icons](https://simpleicons.org/)
- [Tailwind CSS](https://tailwindcss.com/)
