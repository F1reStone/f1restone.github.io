# HeroEffect1

Native WebGPU integration of the user-supplied Figma **Moving gradient** export
(`main.ts` and `features.json`, version 2, animated, no mouse input).

`figma:shaders` is used only by the export's `defineProperties` call to register
editor controls. Rendering uses standard WebGPU APIs already present in the
export. The website supplies a canvas/device/frame instead of importing that
Figma-specific module. `@webgpu/types` is a development-only type dependency.

## Fidelity

- `moving-gradient.wgsl` contains the original WGSL without algorithm changes.
- `source.ts` retains the original setup/render code, with TypeScript host types,
  an external WGSL import, and an explicit null-view guard. Geometry remains six
  112×112 cube-sphere faces, with 4× MSAA and the original depth/backdrop passes.
- Noise, displacement, torsion, orientation, gradient methods, materials, OKLab
  interpolation and zoom mapping are retained. There is no extra bloom, vignette,
  colour grading or speed multiplier.
- `renderer.ts` adapts the browser canvas and advances `frame.time` in milliseconds,
  matching the export's `time * 0.001` conversion. Pausing/resuming does not jump.
- Website defaults use the user's adjusted Figma preset: detail 3.67, intensity
  1.38, twist 0.56, flow 0.76, zoom 58%, speed 5%, morph speed 1.55 and colour
  balance 18%. Material remains None (0) and colour method remains Height (0).
  The opaque stops are 17% `#00C7FD`, 47% `#7D3CFA`, 68% `#FD579C` and
  100% `#F8D762`. Positions and RGBA channels are normalised to 0-1; percentage
  controls retain their original units and mappings.

Reference validation compared the original export and this integration on the
same GPU with identical explicit parameters at 0, 2 and 8 seconds, plus two
custom material/colour configurations:
all five comparisons had zero differing output bytes. This verifies the supplied
algorithm; it does not promise identical pixels across different GPU drivers,
display colour profiles or render resolutions.

## Usage

```astro
<Hero layout="split" size="xl" class="invert-section" showEffect1 fullHeight>
  <h1 slot="title">To the Infinite Future</h1>
</Hero>
```

Only homepages pass `fullHeight`. Other pages keep content-driven height. Hero
content uses the shared `max-w-8xl` container without an additional width cap.
The effect can also be placed directly inside any positioned container:

```astro
<HeroEffect1 morphSpeed={1.55} rotationSpeed={5} />
```

`effect1={{ ... }}` on `Hero`, or props on `HeroEffect1`, expose the original
controls. See `types.ts` for defaults and the colour-stop shape.

| Control                             | Range / values                                        |
| ----------------------------------- | ----------------------------------------------------- |
| `detail`, `intensity`, `morphSpeed` | 0–5                                                   |
| `twist`                             | 0–7                                                   |
| `warp` (Flow)                       | 0–1.5                                                 |
| `zoom`, `rotationSpeed`             | 0–100 percent, using the original mappings            |
| `gradientBalance`                   | −100–100 percent                                      |
| `material`                          | 0 none, 1 satin, 2 glossy, 3 metallic, 4 iridescent   |
| `gradientMethod`                    | 0 height, 1 noise, 2 facing                           |
| `gradient.stops`                    | 1–8 ordered stops; positions and RGBA channels in 0–1 |

## Lifecycle and fallback

The existing global `data-effect-hero` preference selects the renderer. Static
mode and reduced motion load an image without importing the renderer or
requesting a GPU device. Dynamic mode starts WebGPU without requesting fallback
images. Manual settings changes switch modes; returning to static releases the
GPU device, buffers, textures and canvas. Hidden tabs and offscreen effects pause
animation. Disconnecting releases resources and cancels pending initialisation;
initialisation failure or device loss loads the image fallback.

The lossless fallback masters use the adjusted preset at time zero, rendered at
1440×900 and 390×844 into `src/assets/index/hero-effect-1-{landscape,portrait}.png`.
Astro's `Picture` generates AVIF sources first, followed by WebP sources and a
WebP fallback. CSS selects the portrait composition at aspect ratios up to 1:1;
other viewports use the landscape composition. Images cover the hero bounds.

Optimised pictures are stored in inert templates. Static mode mounts only the
matching composition, with eager loading and asynchronous decoding. Resizing
across the 1:1 aspect-ratio boundary replaces it with the other composition.
The component consumes the existing global performance classification and
settings event; it does not repeat hardware detection or performance sampling.
Mobile devices retain the global default of static mode, with a stored manual
choice taking precedence except when reduced motion is active.

A `noscript` fallback preserves both compositions with CSS selection when
JavaScript is disabled; in that case browsers may download both images. The CSS
gradient remains visible while the chosen image or WebGPU renderer is loading.

Unsupported WebGPU and disabled JavaScript display the fallback; a custom
gradient uses CSS with the specified stops. Custom geometry/animation values
require WebGPU.

The drawing buffer is capped at DPR 2 and 2.6 million pixels. Only raster
resolution is bounded; the original shader and mesh are unchanged. The previous
scroll-progress distortion was removed because it changes the exported effect.
