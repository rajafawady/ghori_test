import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a date field that might be a Date object or string
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "Invalid Date";
  }
}

/**
 * Safely format a date field with custom options
 */
export function formatDateWithOptions(
  date: Date | string | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "N/A";

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "Invalid Date";
  }
}
