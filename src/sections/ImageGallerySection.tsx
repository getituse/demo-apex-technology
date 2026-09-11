import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ResponsiveImage } from "@/components/media/Image";
import { cn } from "@/lib/cn";
import { SectionIntro } from "./section-layout";
import { GalleryEnhancementBoundary } from "./GalleryEnhancementBoundary";
import type { SectionComponentProps } from "./section-types";

const GalleryViewer = lazy(() => import("./GalleryViewer"));

export function ImageGallerySection({
  section,
  headingLevel,
}: SectionComponentProps<"imageGallery">) {
  const root = useRef<HTMLDivElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEnhanced(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className="space-y-8">
      <SectionIntro section={section} headingLevel={headingLevel} />
      {section.items.length ? (
        <div
          className={cn(
            section.variant === "masonry"
              ? "columns-1 gap-6 sm:columns-2 lg:columns-3"
              : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {section.items.map((item) => (
            <figure key={item.id} className="mb-6 break-inside-avoid space-y-3">
              <button
                type="button"
                className="block w-full rounded text-left"
                aria-label={`View image: ${item.caption ?? (item.image.alt || item.id)}`}
                onClick={() => {
                  setEnhanced(true);
                  setSelected(section.items.indexOf(item));
                }}
              >
                <ResponsiveImage
                  {...item.image}
                  aspect={section.variant === "masonry" ? "auto" : "4/3"}
                  className="rounded"
                />
              </button>
              {item.caption && <figcaption className="text-sm">{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        <p>{section.emptyMessage}</p>
      )}
      {enhanced && (
        <GalleryEnhancementBoundary>
          <Suspense fallback={selected === null ? null : <p role="status">Loading image viewer</p>}>
            <GalleryViewer items={section.items} selected={selected} onSelect={setSelected} />
          </Suspense>
        </GalleryEnhancementBoundary>
      )}
    </div>
  );
}
