import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useId, type ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ModalProps } from "@/components/ui/Modal";
import type ViewerComponent from "@/sections/GalleryViewer";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { createSectionExamples } from "@/routes/section-examples";
import { ImageGallerySection } from "@/sections/ImageGallerySection";
import type { SectionOf } from "@/sections/section-types";
import { config, content } from "@/site";

const viewerRender = vi.hoisted(() => vi.fn());

// Observe lazy mounting without replacing the viewer's selection or keyboard logic.
vi.mock("@/sections/GalleryViewer", async (importOriginal) => {
  const { default: Viewer } = await importOriginal<{ default: typeof ViewerComponent }>();
  return {
    default: function ObservedViewer(props: ComponentProps<typeof Viewer>) {
      viewerRender(props.selected);
      return <Viewer {...props} />;
    },
  };
});

// Match the existing state-test convention. This adapter supplies Modal's close
// contract only; real Escape handling, focus trap/return and motion are browser checks.
vi.mock("@/components/ui/Modal", () => ({
  Modal: function ModalAdapter({
    open,
    onOpenChange,
    title,
    description,
    children,
    closeLabel = "Close",
  }: ModalProps) {
    const id = useId();
    useEffect(() => {
      if (!open) return;
      const close = (event: KeyboardEvent) => {
        if (event.key === "Escape") onOpenChange(false);
      };
      document.addEventListener("keydown", close);
      return () => document.removeEventListener("keydown", close);
    }, [open, onOpenChange]);
    return open ? (
      <div role="dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
        <button type="button" aria-label={closeLabel} onClick={() => onOpenChange(false)}>
          {closeLabel}
        </button>
        {children}
      </div>
    ) : null;
  },
}));

const gallery: SectionOf<"imageGallery"> = createSectionExamples(config).imageGallery;
const first = gallery.items[0]!;
const second = gallery.items[1]!;

function Gallery({ section = gallery }: { section?: SectionOf<"imageGallery"> }) {
  return (
    <MemoryRouter>
      <TenantProvider config={config} content={content}>
        <ImageGallerySection section={section} headingLevel="h2" />
      </TenantProvider>
    </MemoryRouter>
  );
}

function expectImageMetadata(image: HTMLElement, item: (typeof gallery.items)[number]) {
  expect(image).toHaveAttribute("src", item.image.src);
  expect(image).toHaveAttribute("alt", item.image.alt);
  expect(image).toHaveAttribute("width", String(item.image.width));
  expect(image).toHaveAttribute("height", String(item.image.height));
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute("decoding", "async");
  expect(image).toHaveAttribute("fetchpriority", "auto");
}

function expectSelected(index: number) {
  const item = gallery.items[index]!;
  const dialog = screen.getByRole("dialog", { name: item.caption ?? "Image viewer" });
  expect(dialog).toHaveAccessibleDescription(`Image ${index + 1} of ${gallery.items.length}`);
  expectImageMetadata(within(dialog).getByRole("img", { name: item.image.alt }), item);
  expect(within(dialog).getByRole("img")).toHaveClass("object-contain");
  return dialog;
}

function arrowEvent() {
  const event = new KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true });
  act(() => {
    document.dispatchEvent(event);
  });
  return event;
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", undefined);
  viewerRender.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("gallery lightbox state and media contracts", () => {
  it.each(["grid", "masonry"] as const)(
    "prerenders %s images, captions and space-reserving metadata without the viewer",
    (variant) => {
      const html = renderToString(<Gallery section={{ ...gallery, variant }} />);
      const parsed = new DOMParser().parseFromString(html, "text/html");
      // Role queries need an owner document with a window; DOMParser's is detached.
      const markup = document.importNode(parsed.body, true);
      const figures = [...markup.querySelectorAll("figure")];
      expect(figures).toHaveLength(gallery.items.length);
      for (const [index, figure] of figures.entries()) {
        const item = gallery.items[index]!;
        expectImageMetadata(within(figure).getByRole("img"), item);
        expect(within(figure).getByRole("button")).toHaveAccessibleName(
          `View image: ${item.caption ?? item.image.alt}`,
        );
        expect(figure.querySelector("picture")).toHaveClass("block", "overflow-hidden");
        if (variant === "grid") {
          expect(figure.querySelector("picture")).toHaveClass("aspect-[4/3]");
        } else {
          expect(figure.querySelector("picture")).not.toHaveClass("aspect-[4/3]");
        }
        if (item.caption)
          expect(figure.querySelector("figcaption")).toHaveTextContent(item.caption);
        else expect(figure.querySelector("figcaption")).toBeNull();
      }
      expect(figures[0]!.parentElement).toHaveClass(
        ...(variant === "grid"
          ? ["grid", "sm:grid-cols-2", "lg:grid-cols-3"]
          : ["columns-1", "sm:columns-2", "lg:columns-3"]),
      );
      expect(markup.querySelector("source, [role='dialog'], [aria-busy='true']")).toBeNull();
      expect(html).not.toContain("Loading image viewer");
      expect(viewerRender).not.toHaveBeenCalled();
    },
  );

  it("keeps the enhancement unmounted until activation without an observer", async () => {
    render(<Gallery />);
    const thumbnails = screen.getAllByRole("img");
    expect(viewerRender).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Loading image viewer")).toBeNull();
    expect(screen.getByText(first.caption!)).toBeVisible();

    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: `View image: ${first.caption}` })).toHaveFocus();
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog");
    expect(viewerRender).toHaveBeenCalledWith(0);
    expectSelected(0);
    for (const [index, image] of thumbnails.entries()) {
      expect(image).toBeInTheDocument();
      expectImageMetadata(image, gallery.items[index]!);
    }
    expect(screen.queryByText("Loading image viewer")).toBeNull();
  });

  it("enhances only near the viewport and disconnects the observer without opening", async () => {
    let notify: IntersectionObserverCallback | undefined;
    const observer = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: () => [],
      root: null,
      rootMargin: "200px",
      thresholds: [0],
    } satisfies IntersectionObserver;
    const constructor = vi.fn((callback: IntersectionObserverCallback) => {
      notify = callback;
      return observer;
    });
    vi.stubGlobal("IntersectionObserver", constructor);
    const { unmount } = render(<Gallery />);
    expect(constructor).toHaveBeenCalledWith(expect.any(Function), { rootMargin: "200px" });
    expect(observer.observe).toHaveBeenCalledOnce();
    expect(viewerRender).not.toHaveBeenCalled();
    const target = observer.observe.mock.calls[0]![0] as Element;
    const entry: IntersectionObserverEntry = {
      target,
      isIntersecting: false,
      intersectionRatio: 0,
      time: 0,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: target.getBoundingClientRect(),
      rootBounds: null,
    };
    expect(notify).toBeDefined();
    act(() => notify!([entry], observer));
    expect(viewerRender).not.toHaveBeenCalled();
    expect(observer.disconnect).not.toHaveBeenCalled();
    act(() => notify!([{ ...entry, isIntersecting: true, intersectionRatio: 1 }], observer));
    await waitFor(() => expect(viewerRender).toHaveBeenCalledWith(null));
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Loading image viewer")).toBeNull();
    expect(screen.getAllByRole("img")).toHaveLength(gallery.items.length);
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(2);
  });

  it("opens the selected thumbnail and wraps with both labelled arrow controls", async () => {
    render(<Gallery />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: `View image: ${second.image.alt}` }));
    await screen.findByRole("dialog");
    expectSelected(1);
    await user.click(screen.getByRole("button", { name: "Next image" }));
    expectSelected(0);
    await user.click(screen.getByRole("button", { name: "Previous image" }));
    expectSelected(1);
    await user.click(screen.getByRole("button", { name: "Previous image" }));
    expectSelected(0);
  });

  it("wraps Left/Right keys and closes through the Modal Escape adapter", async () => {
    render(<Gallery />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: `View image: ${first.caption}` }));
    await screen.findByRole("dialog");
    expectSelected(0);
    await user.keyboard("{ArrowLeft}");
    expectSelected(1);
    await user.keyboard("{ArrowRight}");
    expectSelected(0);
    await user.keyboard("{ArrowRight}");
    expectSelected(1);
    await user.keyboard("{ArrowRight}");
    expectSelected(0);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(arrowEvent().defaultPrevented).toBe(false);
    expect(screen.getByText(first.caption!)).toBeVisible();
    expect(screen.getAllByRole("img")).toHaveLength(gallery.items.length);
    await user.click(screen.getByRole("button", { name: `View image: ${second.image.alt}` }));
    expectSelected(1);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("removes active arrow handling on unmount", async () => {
    const { unmount } = render(<Gallery />);
    await userEvent.click(screen.getByRole("button", { name: `View image: ${first.caption}` }));
    await screen.findByRole("dialog");
    expect(arrowEvent().defaultPrevented).toBe(true);
    expectSelected(1);
    unmount();
    expect(arrowEvent().defaultPrevented).toBe(false);
  });

  it("keeps a single image usable without redundant navigation controls", async () => {
    render(<Gallery section={{ ...gallery, items: [first] }} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: `View image: ${first.caption}` }));
    const dialog = await screen.findByRole("dialog", { name: first.caption });
    expect(dialog).toHaveAccessibleDescription("Image 1 of 1");
    expect(within(dialog).queryByRole("button", { name: "Previous image" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Next image" })).toBeNull();
    await user.keyboard("{ArrowLeft}{ArrowRight}");
    expect(dialog).toHaveAccessibleDescription("Image 1 of 1");
    expectImageMetadata(within(dialog).getByRole("img"), first);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses the item identifier for a captionless decorative thumbnail", async () => {
    const item = {
      ...first,
      id: "decorative",
      caption: undefined,
      image: { ...first.image, alt: "" },
    };
    const { container } = render(<Gallery section={{ ...gallery, items: [item] }} />);
    expect(container.querySelector("figcaption")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "View image: decorative" }));
    const dialog = await screen.findByRole("dialog", { name: "Image viewer" });
    expectImageMetadata(within(dialog).getByRole("presentation"), item);
    expect(dialog).toHaveAccessibleDescription("Image 1 of 1");
  });

  it("renders the configured empty state without images or viewer controls", () => {
    render(<Gallery section={{ ...gallery, items: [] }} />);
    expect(screen.getByText(gallery.emptyMessage)).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(viewerRender).not.toHaveBeenCalled();
  });
});
