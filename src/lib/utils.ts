import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanClassName(title: string): string {
  // Remove " - Groupe X" or similar patterns from class titles
  return title.split(' - ')[0].trim();
}
