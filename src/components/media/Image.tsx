import { assetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";

export type ImageAspect = "16/9" | "4/3" | "3/2" | "1/1" | "3/4" | "auto";
export type ImageFit = "cover" | "contain";

export interface ResponsiveImageProps {
  src: string;
  /**
   * Empty string marks the image as decorative and hides it from assistive tech.
   * It is required rather than optional so the decision is always made deliberately.
   */
  alt: string;
  width: number;
  height: number;
  aspect?: ImageAspect;
  fit?: ImageFit;
  /** CSS object-position, e.g. "50% 30%", so a face is never cropped out. */
  focalPoint?: string;
  /** Hero images only. Loads eagerly, decodes synchronously and gets fetch priority. */
  priority?: boolean;
  sizes?: string;
  /** Widths to offer the browser. Files must exist beside `src`. */
  srcSetWidths?: number[];
  /**
   * Modern formats to advertise. Opt-in, and empty by default: once a `<source>`
   * matches, the browser commits to it, so advertising a file that was never generated
   * shows a broken image rather than falling back to the `<img>`.
   */
  formats?: ("avif" | "webp")[];
  className?: string;
  imgClassName?: string;
}

const aspectClasses: Record<ImageAspect, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
  auto: "",
};

/** `/images/hall.jpg` + 640 -> `/images/hall-640.jpg`. */
function widthVariant(src: string, width: number): string {
  const dot = src.lastIndexOf(".");
  if (dot === -1) return src;
  return `${src.slice(0, dot)}-${width}${src.slice(dot)}`;
}

function replaceExtension(src: string, extension: string): string {
  const dot = src.lastIndexOf(".");
  return dot === -1 ? `${src}.${extension}` : `${src.slice(0, dot)}.${extension}`;
}

function buildSrcSet(src: string, widths: number[]): string | undefined {
  if (widths.length === 0) return undefined;
  return widths.map((width) => `${widthVariant(src, width)} ${width}w`).join(", ");
}

/**
 * The only image component in the product.
 *
 * `width` and `height` are required so the browser can reserve the box before the file
 * arrives — that is what stops layout shift, and it cannot be enforced by convention.
 *
 * AVIF and WebP are offered through `<source>` only when the caller confirms those
 * files exist. The `<img>` always keeps the original format, so there is a real
 * fallback rather than a broken icon.
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  aspect = "auto",
  fit = "cover",
  focalPoint = "50% 50%",
  priority = false,
  sizes = "100vw",
  srcSetWidths = [],
  formats = [],
  className,
  imgClassName,
}: ResponsiveImageProps) {
  const resolvedSrc = assetUrl(src);
  const srcSet = buildSrcSet(resolvedSrc, srcSetWidths);
  const isDecorative = alt === "";

  function sourceSetFor(extension: "avif" | "webp"): string {
    const converted = replaceExtension(resolvedSrc, extension);
    return buildSrcSet(converted, srcSetWidths) ?? converted;
  }

  return (
    <picture className={cn("block overflow-hidden", aspectClasses[aspect], className)}>
      {formats.map((format) => (
        <source key={format} type={`image/${format}`} srcSet={sourceSetFor(format)} sizes={sizes} />
      ))}
      <img
        src={resolvedSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        role={isDecorative ? "presentation" : undefined}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        style={{ objectPosition: focalPoint }}
        className={cn(
          "h-full w-full",
          fit === "cover" ? "object-cover" : "object-contain",
          imgClassName,
        )}
      />
    </picture>
  );
}
