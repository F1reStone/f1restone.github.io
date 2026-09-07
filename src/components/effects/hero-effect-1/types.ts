export interface GradientStop {
  position: number;
  color: { r: number; g: number; b: number; a: number };
}

/** Matches the exported Figma controls, including their units. */
export interface HeroEffect1Options {
  detail: number;
  intensity: number;
  twist: number;
  warp: number;
  /** Percentage, mapped exponentially to the original cover zoom. */
  zoom: number;
  /** Percentage; the export maps 100 to 0.25 radians per time unit. */
  rotationSpeed: number;
  morphSpeed: number;
  material: 0 | 1 | 2 | 3 | 4;
  gradient: { stops: GradientStop[] };
  gradientBalance: number;
  gradientMethod: 0 | 1 | 2;
}

export const heroEffect1Defaults: HeroEffect1Options = {
  detail: 3.67,
  intensity: 1.38,
  twist: 0.56,
  warp: 0.76,
  zoom: 58,
  rotationSpeed: 5,
  morphSpeed: 1.55,
  material: 0,
  gradient: {
    stops: [
      { position: 0.17, color: { r: 0, g: 199 / 255, b: 253 / 255, a: 1 } },
      { position: 0.47, color: { r: 125 / 255, g: 60 / 255, b: 250 / 255, a: 1 } },
      { position: 0.68, color: { r: 253 / 255, g: 87 / 255, b: 156 / 255, a: 1 } },
      { position: 1, color: { r: 248 / 255, g: 215 / 255, b: 98 / 255, a: 1 } },
    ],
  },
  gradientBalance: 18,
  gradientMethod: 0,
};
