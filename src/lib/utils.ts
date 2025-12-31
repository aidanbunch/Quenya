import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SUPPORTED_MIME_TYPES = {
  // Images
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  // Videos
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
  "video/quicktime": ".mov",
  // PDFs
  "application/pdf": ".pdf"
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_MIME_TYPES;

export function getFileExtension(mimeType: string): string {
  return SUPPORTED_MIME_TYPES[mimeType as SupportedMimeType] || "";
}
