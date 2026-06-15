# FireStone Website - Project Context & Agent Guidelines

## 1. Project Overview
- **Base Framework**: Astro Rocket (Astro 6 + Tailwind CSS v4 + TypeScript) - a fork of Velocity.
- **Project Type**: Personal portfolio, tech blog, and project showcase.
- **Primary Goal**: Deliver a visually stunning, Apple/Vercel-level immersive design while strictly adhering to high maintainability, Single Source of Truth (SSOT) architecture, and web performance standards (Lighthouse 100).

## 2. Design System & Brand Identity
- **Brand Colors**: 
  - Cyan (`#00C3FF`)
  - Pink (`#FD579C`)
  - Purple (`#7832FF`)
- **Typography (Variable Fonts)**:
  - Sans: `Wix Madefor Text Variable`
  - Display: `Neue Regrade Variable`
  - Mono: `NKDuy Mono Variable`
  - Serif (Accents/Italics): `Playfair Display Variable`
  - CJK (Fallback): `Noto Sans SC` (Google Fonts async load + Local Fallback strategy).
- **Core Aesthetics**: 
  - **Liquid Glass / Glassmorphism**: Heavy use of `backdrop-filter: blur`, high transparency, and `color-mix`.
  - **Glow Effects**: `drop-shadow` with `currentColor` for context-aware breathing glows.
  - **Progressive Blur**: Soft, ease-out gradient masking (`mask-image`) instead of hard borders.
  - **Ultrawide Ready (21:9)**: Uses custom `.max-w-8xl` (`max(70rem, 80vw)`) for fluid ultrawide scaling without compromising mobile layouts.

## 3. Architectural Golden Rules (MUST FOLLOW)
1. **Maintainability First**: Never hardcode styles into HTML if they belong in a CSS component class. Avoid dirty DOM hacks (e.g., empty `div`s for styling).
2. **SSOT (Single Source of Truth)**: Configurations (Nav links, Footer links, Social Links, i18n) MUST be centralized in `src/config/`. Components must map from these configs dynamically.
3. **GPU Acceleration**: Always use `transform: translate3d` or `translateZ(0)` for animations (Cursors, Carousels, WebGL) to avoid main-thread blocking and layout thrashing.
4. **Layout Thrashing Prevention**: 
   - Variable font weight changes (`hover` bolding) MUST use invisible `::after` pseudo-elements to lock physical width.
   - Animated flex/gap distances MUST be replaced with absolute positioning and exact mathematical pixel calculations (`dotsWidth`).
5. **Variable Scoping over Specificity Hacks**: Use CSS custom property overrides (e.g., redefining `--color-foreground`) for dark/light mode and immersive states, rather than chaining endless Tailwind utility classes.

## 4. Completed Milestones & Major Refactors

### 4.1. Immersive Header & Progressive Blur
- Built a robust `immersiveOnTop` logic. When fixed at the top (unscrolled), the header forces white text + glows over dark gradients.
- Created `.hdr-progressive-glass`: A bleeding glassmorphism effect using `mask-image` gradients for a seamless fade-out.
- **Panel Isolation**: Dropdown panels (`ttg-panel`, `lang-panel`) are strictly isolated from Header color inversions to prevent dark-mode text on dark-mode backgrounds.

### 4.2. GPGPU Neural Field Hero Background
- Replaced basic CSS gradients with a pure WebGL `NeuralField.astro` component.
- Implements Curl Noise and Domain Warping in a Fragment Shader using brand colors.
- Renders at `z-index: -1`, strictly isolated to the Hero wrapper.

### 4.3. High-Performance UI Components
- **Carousel Tablist**: Rewritten with Apple-like absolute positioning. The dot animations (width + glow) use `translate3d`, eliminating sub-pixel layout thrashing. Added leading zeros (`09 / 10`) to counter width-jumps.
- **Nav Links**: Text glows intelligently adapt using `color-mix(in srgb, var(--color-foreground) 50%, transparent)`. `padding`/negative `margin` combo solves `background-clip: text` clipping issues.
- **Custom Cursor**: Offloaded to GPU (`translate3d`), with `html.custom-cursor-active` automatically hiding the system cursor to prevent doubling.
- **Article Hero**: Immersive design, dropping the bottom image card for a full-bleed darkened background overlay (`bg-black/60 backdrop-blur-lg transform-gpu`) with `mix-blend` removed to fix Chrome compositing bugs.

### 4.4. Configuration & i18n
- **Footer**: Integrated `linkGroups` into `nav.config.ts`. Social links are centrally parsed in `utils.ts` via regex.
- **Consent Banner**: Converted the floating reopener to a boolean `showReopener` prop to completely prevent DOM rendering. Trigger moved to a legal link anchor (`#consent-settings`) in the Footer.
- **Auto i18n**: Implemented an async JS sniffer in `<head>` that parses `navigator.language`, matches exact or base prefixes against `locales`, redirects via `window.location.replace` to prevent history pollution, and respects user's `localStorage` override.

## 5. Next Steps / Backlog
1. **Font Subsetting**: Current CJK fonts are large. Need to implement `cn-font-split` for the local `Noto Sans SC` variable font to create a self-hosted, micro-chunked font server.
2. Continual refinement of secondary pages (About, Projects layout) to align with the new 8xl ultrawide grid and Liquid Glass aesthetic.