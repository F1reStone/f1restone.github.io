import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import logoSource from '@/assets/branding/firestone-logo.svg?raw';
import type { HeroLogoFieldOptions } from './types';

const vertexShader = /* glsl */ `
  attribute vec2 aAnchor;
  attribute vec2 aDirection;
  attribute vec4 aMotion;
  attribute vec3 aLight;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform float uSize;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uProgress;
  varying vec2 vUv;
  varying vec3 vLight;
  varying float vFade;
  varying float vBlur;
  varying float vSoftness;

  void main() {
    float flight = aLight.z;
    float phase = fract(aMotion.z + uTime * aMotion.w);
    float reach = length(uResolution) * 0.8;
    float distance = pow(phase, 1.75) * reach;
    // The central logo cannot use a wrapped phase: returning to zero looks like
    // a dropped frame. Keep each instance on its own continuous, non-synchronised
    // waveform so its organic offsets stay in motion without ever teleporting.
    // uTime is already advanced at the configured scene speed. uSpeed remains
    // in the shutter calculation because it represents real-time velocity.
    float contourClock = aMotion.z * 6.2831853 + uTime * aMotion.w * 1.85;
    float contourPhase = sin(contourClock);
    float contourDrift = sin(contourClock * 1.71 + aMotion.z * 11.0);
    float travel = mix(contourPhase * uSize * 0.014, distance, flight);
    float stretch = mix(0.98 + contourPhase * 0.11, 0.45 + distance / uSize * 2.6, flight);
    float streakLength = aMotion.x * uSize * stretch;
    // Integrate a short shutter interval along each ray's actual radial velocity.
    float velocity = 1.75 * pow(phase, 0.75) * reach * aMotion.w * uSpeed;
    float shutter = mix(uSize * 0.005, velocity * 0.022, flight);
    vBlur = shutter / (streakLength + shutter);
    vSoftness = smoothstep(6.0, 16.0, aMotion.y);
    float halfWidth = aMotion.y * clamp(uSize / 300.0, 0.65, 1.6);
    vec2 normal = vec2(-aDirection.y, aDirection.x);
    vec2 anchor = uCenter + aAnchor * uSize * (1.0 + uProgress * 0.1);
    vec2 pixel = anchor + aDirection * (travel - streakLength * (1.0 - flight) - shutter + position.x * (streakLength + shutter))
      + normal * (position.y * halfWidth + mix(contourDrift * uSize * 0.006, 0.0, flight));
    gl_Position = vec4(pixel.x / uResolution.x * 2.0 - 1.0,
      1.0 - pixel.y / uResolution.y * 2.0, 0.0, 1.0);
    vUv = uv;
    vLight = aLight;
    float birth = smoothstep(0.0, 0.07, phase);
    float end = 1.0 - smoothstep(0.9, 1.0, phase);
    vFade = mix(0.77 + 0.23 * sin(contourClock * 1.13 + aMotion.z * 8.0), birth * end, flight);
    // Keep the title legible without cutting off the outgoing lower rays.
    float below = smoothstep(uCenter.y + uSize * 0.48, uCenter.y + uSize * 0.8, pixel.y);
    float textColumn = 1.0 - smoothstep(uSize * 0.8, uSize * 1.7, abs(pixel.x - uCenter.x));
    vFade *= 1.0 - below * textColumn * 0.93;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHighlight;
  varying vec2 vUv;
  varying vec3 vLight;
  varying float vFade;
  varying float vBlur;
  varying float vSoftness;

  vec4 exposureSample(float x, float y) {
    float valid = step(0.0, x) * step(x, 1.0);
    float taper = smoothstep(0.0, 0.16, x) * pow(1.0 - smoothstep(0.55, 1.0, x), 0.7);
    float across = abs(y) / max(0.025, taper);
    float core = exp(-across * across * mix(48.0, 12.0, vSoftness));
    float glow = exp(-across * across * 6.0) * 0.18;
    float envelope = smoothstep(0.0, 0.24, x) * (1.0 - smoothstep(0.82, 1.0, x));
    float white = smoothstep(0.14, 0.82, x) * core * vLight.x;
    vec3 light = mix(uColor * 0.65, uHighlight, white);
    float alpha = (core + glow) * envelope * valid;
    return vec4(light * alpha, alpha);
  }

  void main() {
    float blur = vBlur / max(0.01, 1.0 - vBlur);
    float x = (vUv.x - vBlur) / max(0.01, 1.0 - vBlur);
    float y = vUv.y * 2.0 - 1.0;
    vec4 exposure = exposureSample(x, y) * 0.34;
    exposure += exposureSample(x + blur * 0.33, y) * 0.28;
    exposure += exposureSample(x + blur * 0.67, y) * 0.23;
    exposure += exposureSample(x + blur, y) * 0.15;
    gl_FragColor = vec4(exposure.rgb / max(0.001, exposure.a), exposure.a * vLight.y * vFade);
  }
`;

function randomGenerator(seed: number) {
  let state = seed | 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGeometry(seed: number) {
  const random = randomGenerator(seed);
  const document = new DOMParser().parseFromString(logoSource, 'image/svg+xml');
  const svg = document.documentElement as unknown as SVGSVGElement;
  const viewBox = svg.viewBox.baseVal;
  const anchors: number[] = [];
  const directions: number[] = [];
  const motion: number[] = [];
  const lights: number[] = [];
  const polygons: Vector2[][] = [];

  const add = (point: Vector2, flight: boolean, length = 0) => {
    const angle = Math.atan2(point.y, point.x) + (random() - 0.5) * (flight ? 0.018 : 0.025);
    const direction = new Vector2(Math.cos(angle), Math.sin(angle));
    const offset = (random() - 0.5) * (flight ? 0.038 : 0.09);
    anchors.push(point.x + direction.x * offset, point.y + direction.y * offset);
    directions.push(direction.x, direction.y);
    motion.push(
      flight ? 0.22 + random() * 0.42 : length,
      flight ? 4 + random() ** 3 * 15 : 6.5 + random() ** 2 * 9,
      random(),
      0.24 + random() * 0.28
    );
    lights.push(
      0.55 + random() * 0.45,
      flight ? 0.06 + random() ** 3 * 0.48 : 0.45 + random() ** 2 * 0.8,
      flight ? 1 : 0
    );
  };

  for (const path of svg.querySelectorAll('path')) {
    const length = path.getTotalLength();
    const count = Math.ceil(length);
    const polygon: Vector2[] = [];
    for (let index = 0; index < count; index++) {
      const sample = path.getPointAtLength((index / count) * length);
      const point = new Vector2(
        (sample.x - viewBox.width / 2) / viewBox.width,
        (sample.y - viewBox.height / 2) / viewBox.width
      );
      polygon.push(point);
    }
    polygons.push(polygon);
  }

  const intersections = (direction: Vector2, polygon: Vector2[]) => {
    const radii: number[] = [];
    for (let index = 0; index < polygon.length; index++) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const edgeX = end.x - start.x;
      const edgeY = end.y - start.y;
      const cross = direction.x * edgeY - direction.y * edgeX;
      if (Math.abs(cross) < 1e-8) continue;
      const radius = (start.x * edgeY - start.y * edgeX) / cross;
      const alongEdge = (start.x * direction.y - start.y * direction.x) / cross;
      if (radius > 0 && alongEdge >= 0 && alongEdge < 1) radii.push(radius);
    }
    return radii.sort((a, b) => a - b);
  };

  // Sample rays through each facet, then vary their free endpoints. Long blue tails
  // run inward, with bright tips describing the logo without clipping a texture.
  for (let index = 0; index < 125; index++) {
    const angle = ((index + (random() - 0.5) * 0.8) / 125) * Math.PI * 2;
    const direction = new Vector2(Math.cos(angle), Math.sin(angle));
    for (const polygon of polygons) {
      const radii = intersections(direction, polygon);
      if (!radii.length) continue;
      const outer = radii[radii.length - 1];
      const inner = radii.length > 1 ? radii[0] : 0;
      const length = Math.min(0.4, outer - inner) * (0.32 + random() * 0.74);
      if (length > 0.007) add(direction.clone().multiplyScalar(outer), false, length);
    }
  }

  // Each ray starts beyond the silhouette in its own direction. There is no logo mask.
  for (let index = 0; index < 2100; index++) {
    const angle = random() * Math.PI * 2;
    const direction = new Vector2(Math.cos(angle), Math.sin(angle));
    let radius = 0.22;
    for (const polygon of polygons) {
      const radii = intersections(direction, polygon);
      if (radii.length) radius = Math.max(radius, radii[radii.length - 1]);
    }
    add(direction.multiplyScalar(radius + 0.055 + random() * 0.11), true);
  }

  const geometry = new InstancedBufferGeometry();
  geometry.setIndex([0, 2, 1, 0, 3, 2]);
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3)
  );
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
  geometry.setAttribute('aAnchor', new InstancedBufferAttribute(new Float32Array(anchors), 2));
  geometry.setAttribute(
    'aDirection',
    new InstancedBufferAttribute(new Float32Array(directions), 2)
  );
  geometry.setAttribute('aMotion', new InstancedBufferAttribute(new Float32Array(motion), 4));
  geometry.setAttribute('aLight', new InstancedBufferAttribute(new Float32Array(lights), 3));
  geometry.instanceCount = anchors.length / 2;
  return geometry;
}

export function createLogoField(host: HTMLElement, options: HeroLogoFieldOptions) {
  const renderer = new WebGLRenderer({
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(options.background);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const geometry = makeGeometry(options.seed);
  const uniforms = {
    uResolution: { value: new Vector2(1, 1) },
    uCenter: { value: new Vector2() },
    uSize: { value: 300 },
    uTime: { value: 4.25 },
    uSpeed: { value: Math.max(0, options.speed) },
    uProgress: { value: 0 },
    uColor: { value: new Color(options.color) },
    uHighlight: { value: new Color(options.highlight) },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });
  const scene = new Scene();
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const camera = new OrthographicCamera();
  const composer = new EffectComposer(renderer);
  const scenePass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.38, 0, 0.72);
  bloom.compositeMaterial.uniforms.bloomFactors.value = [1, 0.45, 0.15, 0.035, 0];
  const output = new OutputPass();
  composer.addPass(scenePass);
  composer.addPass(bloom);
  composer.addPass(output);
  const canvas = renderer.domElement;
  host.append(canvas);

  const render = () => composer.render();
  const resize = () => {
    const bounds = host.getBoundingClientRect();
    const anchor = host.querySelector('.hero-logo-anchor')!.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      1.75,
      Math.sqrt(2_600_000 / (bounds.width * bounds.height))
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(bounds.width, bounds.height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(bounds.width, bounds.height);
    uniforms.uResolution.value.set(bounds.width, bounds.height);
    uniforms.uCenter.value.set(
      anchor.left + anchor.width / 2 - bounds.left,
      anchor.top + anchor.height / 2 - bounds.top
    );
    uniforms.uSize.value = anchor.width;
    render();
  };

  return {
    canvas,
    resize,
    render,
    advance(delta: number) {
      uniforms.uTime.value += delta * Math.max(0, options.speed);
      render();
    },
    setProgress(progress: number) {
      uniforms.uProgress.value = Math.min(1, Math.max(0, progress));
      render();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      bloom.dispose();
      output.dispose();
      scenePass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
