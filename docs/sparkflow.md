# SparkFlow interactions

SparkFlow is FireStone's shared CSS interaction system in `src/styles/global.css`.
The first section of `/components/#sparkflow` demonstrates each effect with mouse
hover and keyboard focus. Reuse these utilities rather than adding a separate
hover implementation.

| Utility | Target and behavior |
| --- | --- |
| `hover-glow-icon` | SVG, icon wrapper, or control containing SVGs; glows and scales icons without changing the control's background or text. |
| `hover-glow-text` | Text glow using `currentColor`. |
| `hover-glow-box` | Filled control or card; outer glow, hover scale, and press feedback. |
| `hover-glow-outline` | Outlined control, usually with `glass-panel`; preserves the translucent surface while glowing. |
| `hover-solid-fill` | Fills a control with the foreground color and uses the background color for its text. |
| `weight-shift` | Text whose center remains fixed while its weight grows. |
| `weight-shift-non-centered` | Text whose left edge remains fixed while its weight grows. |

## Color and keyboard focus

Pair `hover:text-foreground` with `focus-visible:text-foreground` when muted text
should brighten. For a child of a focusable `.group`, pair
`group-hover:text-foreground` with `group-focus-visible:text-foreground`.
Apply the same pairing to intentional brand-color, border, or reveal effects.
Keep a visible focus outline/ring; color or glow alone is not a replacement.
Selected tab colors remain controlled by their existing active-state branches.

```astro
<a href="/projects/"
  class="text-foreground-muted hover-glow-text hover-glow-icon
    hover:text-foreground focus-visible:text-foreground">
  <span>Projects</span>
  <Icon name="arrow-up-right" size="sm" />
</a>
```

The icon class can also live on one SVG to select just that icon. Its button or
link's hover and keyboard focus still activate the glow. Button SVGs deliberately
keep `pointer-events: none`: the control receives pointer hits instead of its
decorative SVG paths. No JavaScript or change to that policy is needed for glow.
Explicit icon colors (such as muted external arrows) are preserved.

Text glow and weight shifts also respond to a focusable parent `.group`, matching
their group-hover behavior. Use `focus-visible`, rather than generic focus, so a
mouse click does not leave keyboard styling behind. Avoid adding `tabindex` to
decorative elements; put the interaction on a real button or link.

## Weight, composition, and motion preferences

Set `data-text` to exactly the visible text for both weight utilities. An invisible
1000-weight copy reserves the expanded width. Put the utility on the text itself
when composing a button with an icon; its column layout is not a general-purpose
button layout. Footer links use a dedicated grid to reserve text width separately
from their trailing arrows.

`BaseLayout.astro` initializes the weight target from the current weight, increasing
it by 300 up to 900. The global dynamic-effects setting can turn variable weight
off; do not override that preference in demonstrations. Reduced motion disables
scaling/transitions and weight growth; text glow is suppressed by the shared
reduced-motion rules, while icon glow remains an immediate focus/hover cue.

The primary Button already includes box glow. The outline Button combines
`glass-panel`, outline glow, and solid fill; use only the relevant CSS utilities
when demonstrating those effects independently. CSS `scale` on glowing SVGs is
separate from `transform`, preserving icon rotation and loading spinners.

## Verification

Run `pnpm check`, `pnpm build`, and `pnpm exec playwright test e2e/icon-glow.spec.ts
e2e/sparkflow.spec.ts --workers=1`. The browser checks cover parent-triggered icon
glow, keyboard color parity, the showcase, reduced motion, and mobile layout.
