import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanClassName(title: string): string {
  // Remove " - Groupe X" or similar patterns from class titles
  return title.split(' - ')[0].trim();
}

export function generateUniqueCode(name: string): string {
  // Remove special characters and spaces, convert to uppercase
  const cleaned = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  
  // Take first 6 characters or less
  const prefix = cleaned.substring(0, 6);
  
  // Generate random 3-digit number
  const suffix = Math.floor(100 + Math.random() * 900);
  
  return `${prefix}${suffix}`;
}

/**
 * Sanitize a filename for Supabase Storage keys.
 * Removes accents, special chars, quotes, and replaces spaces with underscores.
 */
export function sanitizeStorageKey(filename: string): string {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/['"\"]/g, '')          // strip quotes
    .replace(/[^a-zA-Z0-9._-]/g, '_') // replace anything else with _
    .replace(/_+/g, '_')             // collapse multiple underscores
    .replace(/^_|_$/g, '');          // trim leading/trailing _
}
