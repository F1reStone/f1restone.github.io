/// <reference types="@webgpu/types" />
import { setup, render as renderSource, type ShaderFrame, type ShaderState } from './source';
import type { HeroEffect1Options } from './types';

/** Supplies the canvas, GPU device and millisecond clock normally provided by Figma. */
export async function createHeroEffect1(
  host: HTMLElement,
  options: HeroEffect1Options,
  signal: AbortSignal,
  onFailure: () => void
) {
  if (!navigator.gpu) throw new Error('WebGPU unavailable');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter || signal.aborted) throw new Error('WebGPU adapter unavailable');
  const device = await adapter.requestDevice();
  if (signal.aborted) {
    device.destroy();
    throw new Error('Effect disconnected');
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgpu');
  if (!context) {
    device.destroy();
    throw new Error('WebGPU canvas unavailable');
  }
  const format = navigator.gpu.getPreferredCanvasFormat();
  let disposed = false;
  let frame: ShaderFrame;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    frame?.state.vertexBuffer?.destroy();
    frame?.state.indexBuffer?.destroy();
    frame?.state.uniformBuf?.destroy();
    frame?.state.msaaTexture?.destroy();
    frame?.state.depthTexture?.destroy();
    context.unconfigure();
    device.destroy();
    canvas.remove();
  };
  const fail = () => {
    if (!disposed) {
      onFailure();
      dispose();
    }
  };
  void device.lost.then(fail);
  device.addEventListener('uncapturederror', fail, { signal });
  signal.addEventListener('abort', dispose, { once: true });

  const render = () => {
    if (disposed) return;
    frame.output = context.getCurrentTexture();
    renderSource(device, frame);
  };
  const resize = () => {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    // Only drawing-buffer resolution is bounded; geometry and shader math stay intact.
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(2_600_000 / (width * height)),
      device.limits.maxTextureDimension2D / Math.max(width, height)
    );
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    render();
  };
  try {
    context.configure({ device, format, alphaMode: 'premultiplied', colorSpace: 'srgb' });
    host.append(canvas);
    // setup synchronously populates the export's state before the first render.
    frame = {
      state: {} as ShaderState,
      output: context.getCurrentTexture(),
      time: 0,
      params: options,
    };
    device.pushErrorScope('validation');
    setup(device, frame);
    resize();
    const error = await device.popErrorScope();
    if (error) throw new Error(error.message);
    if (signal.aborted || disposed) throw new Error('Effect disconnected');
    return {
      canvas,
      resize,
      render,
      dispose,
      advance(delta: number) {
        // Figma frame.time is milliseconds. No additional speed multiplier or time wrapping.
        frame.time += delta * 1000;
        render();
      },
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
