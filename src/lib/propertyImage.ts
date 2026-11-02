import type { SyntheticEvent } from 'react';

export const PROPERTY_IMAGE_FALLBACK = '/assets/property-placeholder.svg';

export function normalizePropertyImageGallery(values?: Array<string | null | undefined>): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(
    values
      .map((value) => normalizePropertyImageUrl(value))
      .filter((value) => value !== PROPERTY_IMAGE_FALLBACK)
  ));
}

export function normalizePropertyImageUrl(value?: string | null): string {
  if (!value || typeof value !== 'string') return PROPERTY_IMAGE_FALLBACK;
  const trimmed = value.trim();
  if (!trimmed) return PROPERTY_IMAGE_FALLBACK;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/assets/images/');
  }
  if (trimmed.startsWith('src/assets/images/')) {
    return trimmed.replace('src/assets/images/', '/assets/images/');
  }
  if (trimmed.startsWith('public/assets/images/')) {
    return trimmed.replace('public/assets/images/', '/assets/images/');
  }
  if (/^(images\/|assets\/images\/)/i.test(trimmed)) {
    return trimmed.startsWith('assets/') ? `/${trimmed}` : `/assets/${trimmed}`;
  }
  if (/^[^/?#]+\.(avif|gif|jpe?g|png|webp)$/i.test(trimmed)) {
    return `/assets/images/${trimmed}`;
  }
  if (trimmed.startsWith('/assets/')) return trimmed;
  if (/^assets\/images\//i.test(trimmed)) return `/${trimmed}`;
  return PROPERTY_IMAGE_FALLBACK;
}

export function usePropertyImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.src.endsWith(PROPERTY_IMAGE_FALLBACK)) return;
  image.onerror = null;
  image.src = PROPERTY_IMAGE_FALLBACK;
}
