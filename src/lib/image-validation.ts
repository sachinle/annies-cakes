import "server-only";

// Server-side image validation.
//
// The browser already compresses and checks the file, but none of that
// can be trusted — a request can be crafted by hand. Everything the
// client claims (filename, extension, Content-Type) is re-derived here
// from the actual bytes.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const TYPES = {
  webp: "image/webp",
  jpeg: "image/jpeg",
  png: "image/png",
} as const;

export type DetectedType = (typeof TYPES)[keyof typeof TYPES];

/**
 * Identify an image by its magic bytes. Returns null if the bytes are
 * not one of the accepted image formats — which also catches a script
 * or archive renamed to .webp.
 */
export function detectImageType(bytes: Uint8Array): DetectedType | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return TYPES.jpeg;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && PNG.every((b, i) => bytes[i] === b)) {
    return TYPES.png;
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return TYPES.webp;
  }

  return null;
}

export function extensionFor(type: DetectedType): string {
  if (type === TYPES.jpeg) return "jpg";
  if (type === TYPES.png) return "png";
  return "webp";
}
