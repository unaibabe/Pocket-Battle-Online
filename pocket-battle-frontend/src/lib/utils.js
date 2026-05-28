import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility to merge Tailwind CSS classes without conflicts.
 * Uses clsx for conditional classes and twMerge to handle overlaps.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}