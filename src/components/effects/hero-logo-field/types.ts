export interface HeroLogoFieldOptions {
  /** Independent of the site's light/dark theme. CSS hex colors. */
  background: string;
  color: string;
  highlight: string;
  /** Multiplier for outward travel, not the logo's scale. */
  speed: number;
  /** Deterministic variation; preserves the same composition after resize. */
  seed: number;
}

export const heroLogoFieldDefaults: HeroLogoFieldOptions = {
  background: '#000102',
  color: '#4587ff',
  highlight: '#d5f2ff',
  speed: 0.24,
  seed: 42,
};
