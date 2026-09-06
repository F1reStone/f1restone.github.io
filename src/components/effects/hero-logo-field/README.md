# FireStone Light Trails

`HeroLogoField.astro` renders a decorative full-bleed Three.js scene. The logo
comes from `src/assets/branding/firestone-logo.svg`; native SVG geometry APIs
sample its facets. Radial intersections establish free light-trail endpoints,
with seeded displacement instead of a texture mask.

## Usage

```astro
<Hero
  showLogoField
  fullHeight
  class="invert-section"
  logoField={{
    background: '#000102',
    color: '#4587ff',
    highlight: '#d5f2ff',
    speed: 0.24,
    seed: 42,
  }}
>
  <h1 slot="title">...</h1>
</Hero>
```

The same options work directly on `<HeroLogoField />`. Colors are independent
CSS hex colors. `speed` multiplies elapsed time; zero holds the initial frame.
`seed` changes the deterministic distribution. Defaults live in `types.ts`.
Only the homepages pass `fullHeight`, which guarantees at least `100svh` while
allowing content to expand on short viewports.

## Rendering

- One instanced draw produces the logo rays and 2,100 outward trajectories.
- The shader integrates four samples along radial velocity for directional
  motion blur. Tapered profiles blend blue tails into cool-white light cores.
- A half-float composer applies restrained multi-scale Bloom, followed by
  ACES tone mapping and the final sRGB conversion.
- The drawing buffer is capped at 2.6 million pixels and DPR 1.75. Expensive
  imports load only on pages containing the custom element.
- The existing `data-effect-hero` state and `firestone-effects-change` event
  control animation. Reduced motion renders one still frame; hidden tabs and
  offscreen scenes pause. Resize redraws static scenes at the new dimensions.
- The custom element disposes GPU resources and listeners on removal. WebGL
  failure/context loss and disabled JavaScript use the checked-in WebP poster.
  That emergency poster uses the default blue palette; custom palettes apply
  to both animated and static WebGL rendering.

`Hero.astro` supplies `--hero-logo-size` and `--hero-logo-center-y`. The hidden
`.hero-logo-anchor` resolves responsive CSS lengths into screen coordinates,
keeping the visual and the title layout in agreement.

## Future Scroll Integration

An optional event accepts normalized progress without depending on Lenis:

```ts
const field = document.querySelector('[data-hero-logo-field]');
field?.dispatchEvent(
  new CustomEvent('firestone-hero-progress', {
    detail: { progress: 0.5 },
  })
);
```

Progress from zero to one gently expands the emission region. Static and
reduced-motion preferences suppress this input. A future scroll controller
should dispatch at most once per animation frame; the effect does not create
its own scrolling implementation.
