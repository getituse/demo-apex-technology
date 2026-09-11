import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { ResponsiveImage } from "@/components/media/Image";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import type { SectionOf } from "./section-types";

export default function GalleryViewer({
  items,
  selected,
  onSelect,
}: {
  items: SectionOf<"imageGallery">["items"];
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  const index = selected ?? 0;
  const item = items[index];
  const move = (step: number) => onSelect((index + step + items.length) % items.length);
  useEffect(() => {
    if (selected === null || !items.length) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      onSelect((selected + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, items.length, onSelect]);
  return (
    <Modal
      open={selected !== null && Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onSelect(null);
      }}
      title={item?.caption ?? "Image viewer"}
      description={`Image ${index + 1} of ${items.length}`}
    >
      {item && (
        <div>
          <ResponsiveImage {...item.image} aspect="auto" fit="contain" className="max-h-[60vh]" />
          {items.length > 1 && (
            <div className="mt-4 flex justify-between gap-4">
              <IconButton
                label="Previous image"
                icon={<ArrowLeft />}
                variant="outline"
                onClick={() => move(-1)}
              />
              <IconButton
                label="Next image"
                icon={<ArrowRight />}
                variant="outline"
                onClick={() => move(1)}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
