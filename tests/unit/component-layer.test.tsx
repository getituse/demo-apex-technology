import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ResponsiveImage } from "@/components/media/Image";
import { cn } from "@/lib/cn";
import * as motionVariants from "@/lib/motion/variants";

describe("cn", () => {
  it("lets a later Tailwind utility win over an earlier one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-foreground", "text-primary")).toBe("text-primary");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("motion variants", () => {
  const required = [
    "fadeIn",
    "fadeRise",
    "staggerContainer",
    "staggerItem",
    "scaleIn",
    "drawer",
    "dropdown",
    "modal",
    "pageTransition",
    "galleryItem",
    "hoverElevation",
  ] as const;

  it.each(required)("exports %s", (name) => {
    expect(motionVariants).toHaveProperty(name);
  });

  it("animates opacity and transform only, so nothing triggers layout", () => {
    const layoutProperties = ["width", "height", "top", "left", "right", "bottom", "margin"];
    const serialized = JSON.stringify(motionVariants);

    for (const property of layoutProperties) {
      expect(serialized).not.toContain(`"${property}"`);
    }
  });

  it("adds no delay to children, so above-the-fold content is never held back", () => {
    const visible = motionVariants.staggerContainer.visible as {
      transition?: { delayChildren?: number };
    };
    expect(visible.transition?.delayChildren).toBe(0);
  });

  it("keeps entrance travel subtle", () => {
    const hidden = motionVariants.fadeRise.hidden as { y?: number };
    expect(Math.abs(hidden.y ?? 0)).toBeLessThanOrEqual(24);
  });
});

describe("ResponsiveImage", () => {
  it("always reserves its box, so nothing shifts when the file arrives", () => {
    render(<ResponsiveImage src="/img/a.jpg" alt="A hall" width={800} height={450} />);
    const img = screen.getByRole("img", { name: "A hall" });
    expect(img).toHaveAttribute("width", "800");
    expect(img).toHaveAttribute("height", "450");
  });

  it("lazy-loads and decodes asynchronously by default", () => {
    render(<ResponsiveImage src="/img/a.jpg" alt="A hall" width={800} height={450} />);
    const img = screen.getByRole("img", { name: "A hall" });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("loads a priority image eagerly", () => {
    render(<ResponsiveImage src="/img/a.jpg" alt="Hero" width={1600} height={900} priority />);
    const img = screen.getByRole("img", { name: "Hero" });
    expect(img).toHaveAttribute("loading", "eager");
    expect(img).toHaveAttribute("fetchpriority", "high");
  });

  it("hides a decorative image from assistive technology", () => {
    render(<ResponsiveImage src="/img/a.jpg" alt="" width={80} height={80} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("builds a width-descriptor srcset", () => {
    render(
      <ResponsiveImage
        src="/img/a.jpg"
        alt="A hall"
        width={800}
        height={450}
        srcSetWidths={[400, 800]}
        sizes="(min-width: 768px) 50vw, 100vw"
      />,
    );

    const img = screen.getByRole("img", { name: "A hall" });
    expect(img).toHaveAttribute("srcset", "/img/a-400.jpg 400w, /img/a-800.jpg 800w");
    expect(img).toHaveAttribute("sizes", "(min-width: 768px) 50vw, 100vw");
  });

  it("advertises no modern format unless the caller confirms the files exist", () => {
    const { container } = render(
      <ResponsiveImage src="/img/a.jpg" alt="A hall" width={800} height={450} />,
    );
    expect(container.querySelectorAll("source")).toHaveLength(0);
  });

  it("emits AVIF and WebP sources when asked, keeping the original as the fallback", () => {
    const { container } = render(
      <ResponsiveImage
        src="/img/a.jpg"
        alt="A hall"
        width={800}
        height={450}
        formats={["avif", "webp"]}
      />,
    );

    const sources = Array.from(container.querySelectorAll("source"));
    expect(sources.map((source) => source.getAttribute("type"))).toEqual([
      "image/avif",
      "image/webp",
    ]);
    expect(sources[0]).toHaveAttribute("srcset", "/img/a.avif");
    expect(screen.getByRole("img", { name: "A hall" })).toHaveAttribute("src", "/img/a.jpg");
  });

  it("applies a configurable focal point", () => {
    render(
      <ResponsiveImage
        src="/img/a.jpg"
        alt="A hall"
        width={800}
        height={450}
        focalPoint="50% 20%"
      />,
    );
    expect(screen.getByRole("img", { name: "A hall" })).toHaveStyle({ objectPosition: "50% 20%" });
  });
});
