/**
 * ============================================================================
 * PLACEHOLDER MEDIA — REPLACE BEFORE LAUNCH
 * ============================================================================
 *
 * Every placeholder image path in the product is declared here and nowhere else.
 * Components import from this module; they never carry a URL of their own.
 *
 * A customer replacing the demonstration media only has to drop real files into
 * `public/tenants/<tenant-id>/images/` and update the tenant's content data. If a
 * URL were scattered through components instead, that migration would mean hunting
 * through JSX, and a stray demo image would ship.
 *
 * These are local paths on purpose. No component may reference a remote host: an
 * external image is a third-party request on every page load, an availability risk,
 * and a privacy leak the customer never agreed to.
 * ============================================================================
 */

/** 1x1 transparent GIF. Used as the `src` a lazy image holds before it is decoded. */
export const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** Filenames expected inside each tenant's `assets.images` directory. */
export const PLACEHOLDER_IMAGE_FILES = {
  hero: "placeholder-hero.webp",
  wide: "placeholder-wide.webp",
  portrait: "placeholder-portrait.webp",
  square: "placeholder-square.webp",
} as const;

export type PlaceholderImageKind = keyof typeof PLACEHOLDER_IMAGE_FILES;

/**
 * Builds a placeholder path inside the active tenant's image directory.
 * `imagesBasePath` comes from `config.assets.images`, so nothing here knows a tenant id.
 */
export function placeholderImage(imagesBasePath: string, kind: PlaceholderImageKind): string {
  return `${imagesBasePath.replace(/\/$/, "")}/${PLACEHOLDER_IMAGE_FILES[kind]}`;
}

/** Fixed motifs in gallery-01.webp through gallery-12.webp, in file-number order. */
export const GALLERY_ILLUSTRATION_DESCRIPTIONS = [
  "an open book",
  "geometric circle, square and triangle patterns",
  "plant leaves on a stem",
  "a folded paper model",
  "two speech bubbles",
  "musical notes and sound waves",
  "a lined notebook and pencil",
  "a magnifying glass",
  "a cube-shaped building model",
  "two linked screens",
  "two abstract dialogue forms made of curves and circles",
  "a chart with a rising line, not real statistics",
] as const;

/** Original demo illustrations, not photographs of people or premises; replace for a real launch. */
export function galleryIllustration(imagesBasePath: string, number: number) {
  if (!Number.isInteger(number) || number < 1 || number > GALLERY_ILLUSTRATION_DESCRIPTIONS.length)
    throw new Error("Gallery illustration number must be 1–12");
  return {
    src: `${imagesBasePath.replace(/\/$/, "")}/gallery-${String(number).padStart(2, "0")}.webp`,
    alt: `Original illustration of ${GALLERY_ILLUSTRATION_DESCRIPTIONS[number - 1]}; not a photograph of real people or premises`,
    width: 1200,
    height: 800,
  };
}
