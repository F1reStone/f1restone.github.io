// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

interface FirestoneScrollToOptions {
  offset?: number;
  immediate?: boolean;
  duration?: number;
  force?: boolean;
}

interface FirestoneScrollApi {
  scrollTo: (target: number | string | Element, options?: FirestoneScrollToOptions) => void;
  lock: () => void;
  unlock: () => void;
  readonly isSmooth: boolean;
}

interface Window {
  __firestoneScroll?: FirestoneScrollApi;
}

declare namespace App {
  interface Locals {
    contentLocale?: string;
  }
}
