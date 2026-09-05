import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Mask a secret for display: keeps the prefix shape and the last 4 chars. */
export function maskKey(key: string) {
  if (!key) return '';
  if (key.length <= 10) return `${key.slice(0, 2)}${'•'.repeat(Math.max(2, key.length - 2))}`;
  const head = key.slice(0, key.startsWith('sk-') ? 6 : 4);
  return `${head}${'•'.repeat(6)}${key.slice(-4)}`;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function formatCount(n: number) {
  return n.toLocaleString('en-US');
}
