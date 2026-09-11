import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { SectionRenderer } from "@/sections/SectionRenderer";
import { RegisteredSection } from "@/sections/section-registry";
import { createSectionExamples } from "@/routes/section-examples";
import { SECTION_TYPES, type SectionConfig } from "@/sections/section-types";
import { CardTitle } from "@/components/ui/Card";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { config, content } from "@/site";

const examples = createSectionExamples(config);
// Chromium covers the real animated dialog; isolate state from jsdom's animation clock here.
vi.mock("@/components/ui/Modal", () => ({
  Modal: ({
    open,
    title,
    description,
    children,
  }: {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <p>{description}</p>
        {children}
      </div>
    ) : null,
}));
function show(sections: SectionConfig[], pageHeadingPresent = false) {
  return render(
    <MemoryRouter>
      <TenantProvider config={config} content={content}>
        <SectionRenderer sections={sections} pageHeadingPresent={pageHeadingPresent} />
      </TenantProvider>
    </MemoryRouter>,
  );
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("section rendering", () => {
  it.each(SECTION_TYPES)("renders %s with real content", async (type) => {
    const { container } = show([{ ...examples[type], id: "preview" }]);
    expect(container.querySelector(`[data-section-type="${type}"]`)).not.toBeNull();
    if (type === "announcementBar")
      expect(screen.getByText(examples.announcementBar.message)).toBeVisible();
    else expect(await screen.findByRole("heading", { level: 1 })).toBeVisible();
    if (type === "imageGallery")
      expect(await screen.findByText("Original demonstration artwork")).toBeVisible();
    if (type === "enquiryForm")
      expect(screen.getByRole("form", { name: "Preview enquiry" })).toBeVisible();
  });
  it("preserves order, hides disabled sections and alternates only visible positions", () => {
    const { container } = show([
      { ...examples.values, id: "first", heading: "First" },
      { ...examples.faq, id: "hidden", heading: "Hidden", enabled: false },
      { ...examples.hero, id: "second", heading: "Second" },
      {
        ...examples.finalCTA,
        id: "last",
        heading: "Last",
        background: "inverted",
        density: "spacious",
      },
    ]);
    expect([...container.querySelectorAll("[data-section-type]")].map((node) => node.id)).toEqual([
      "first",
      "second",
      "last",
    ]);
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(container.querySelector("#first")).toHaveAttribute("data-background", "default");
    expect(container.querySelector("#second")).toHaveAttribute("data-background", "tint");
    expect(container.querySelector("#last")).toHaveAttribute("data-background", "inverted");
    expect(container.querySelector("#last")).toHaveAttribute("data-density", "spacious");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Second" }).tagName).toBe("H2");
  });
  it("does not add another h1 when the page already provides one", () => {
    show([examples.hero, { ...examples.hero, id: "second" }], true);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
  });
  it("supports a fifth-level card title for nested download groups", () => {
    render(<CardTitle as="h5">Preview download</CardTitle>);
    expect(screen.getByRole("heading", { level: 5, name: "Preview download" })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  });
  it.each(["split", "editorial", "collage"] as const)(
    "selects a real %s hero with immediately visible copy",
    (variant) => {
      const hero = {
        ...examples.hero,
        variant,
        images:
          variant === "collage"
            ? Array.from({ length: 3 }, () => examples.hero.images[0]!)
            : examples.hero.images,
      };
      const { container } = show([hero]);
      expect(container.querySelector("[data-section-variant]")).toHaveAttribute(
        "data-section-variant",
        variant,
      );
      expect(screen.getAllByRole("img")).toHaveLength(variant === "collage" ? 3 : 1);
      expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
      expect(container.querySelector('[style*="opacity: 0"]')).toBeNull();
      expect(container.querySelector("img")).toHaveAttribute("loading", "eager");
    },
  );
  it("opens FAQ with keyboard and returns configured answers", async () => {
    show([examples.faq]);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: examples.faq.items[0]!.question })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByText(examples.faq.items[0]!.answer[0]!)).toBeVisible();
  });
  it("dismisses the announcement and keeps other sections", async () => {
    show([{ ...examples.announcementBar, id: "notice" }, examples.faq]);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss preview announcement" }));
    expect(screen.queryByText(examples.announcementBar.message)).toBeNull();
    expect(screen.getByRole("heading", { name: examples.faq.heading })).toBeVisible();
  });
  it("uses explicit empty and demonstration states", () => {
    show([{ ...examples.programGrid, items: [] }, examples.stats]);
    expect(screen.getByText(examples.programGrid.emptyMessage)).toBeVisible();
    expect(screen.getByText("Illustrative example")).toBeVisible();
  });
  it("renders directions and newsletter actions without external embeds or fake forms", () => {
    const { container } = show([examples.map, examples.newsletter]);
    expect(container.querySelector("iframe, form, input")).toBeNull();
    expect(screen.getByRole("link", { name: "View directions" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByText(examples.newsletter.notice)).toBeVisible();
  });
  it("gives each section a unique associated heading", () => {
    const { container } = show([examples.values, examples.faq]);
    const labels = [...container.querySelectorAll("section")].map((node) =>
      node.getAttribute("aria-labelledby"),
    );
    expect(new Set(labels).size).toBe(labels.length);
    for (const section of container.querySelectorAll("section")) {
      expect(
        within(section).getByRole("heading", {
          level: section === container.querySelector("section") ? 1 : 2,
        }).id,
      ).toBe(section.getAttribute("aria-labelledby"));
    }
  });
  it("keeps generated headings independent from caller anchor IDs", () => {
    const { container } = show([
      { ...examples.values, id: "intro" },
      { ...examples.faq, id: "intro-heading" },
    ]);
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("preserves id-less announcement state when reordered without hiding its neighbor", async () => {
    const first = { ...examples.announcementBar, message: "First notice" };
    const second = {
      ...examples.announcementBar,
      message: "Second notice",
      dismissLabel: "Dismiss second",
    };
    const { rerender } = show([first, second]);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss preview announcement" }));
    rerender(
      <MemoryRouter>
        <TenantProvider config={config} content={content}>
          <SectionRenderer sections={[second, first]} />
        </TenantProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Second notice")).toBeVisible();
    expect(screen.queryByText("First notice")).toBeNull();
  });
  it("reserves h1 for persistent content and uses h2 for its cards", async () => {
    show([{ ...examples.announcementBar, heading: "Temporary heading" }, examples.programGrid]);
    expect(screen.getByRole("heading", { name: "Temporary heading" }).tagName).toBe("H2");
    expect(screen.getByRole("heading", { name: examples.programGrid.heading }).tagName).toBe("H1");
    expect(
      screen.getByRole("heading", { name: examples.programGrid.items[0]!.title }).tagName,
    ).toBe("H2");
    await userEvent.click(screen.getByRole("button", { name: "Dismiss preview announcement" }));
    expect(screen.getByRole("heading", { level: 1 })).toBeVisible();
  });
  it("keeps gallery images and captions in raw HTML without an observer or viewer chunk", () => {
    const html = renderToString(
      <MemoryRouter>
        <TenantProvider config={config} content={content}>
          <SectionRenderer sections={[examples.imageGallery]} />
        </TenantProvider>
      </MemoryRouter>,
    );
    expect(html).toContain("Original demonstration artwork");
    expect(html).toContain(examples.imageGallery.items[0]!.image.src);
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain("Loading image viewer");
  });
  it("loads gallery enhancement on demand and navigates with keyboard", async () => {
    show([examples.imageGallery]);
    await userEvent.click(
      screen.getByRole("button", { name: "View image: Original demonstration artwork" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Image 1 of 2")).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    expect(within(dialog).getByText("Image 2 of 2")).toBeVisible();
  });
  it("warns for unknown types in dev but returns nothing in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unknown = { type: "constructor" } as unknown as SectionConfig;
    vi.stubEnv("DEV", true);
    const { container, rerender } = render(<RegisteredSection section={unknown} />);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockClear();
    vi.stubEnv("DEV", false);
    rerender(<RegisteredSection section={unknown} />);
    expect(container).toBeEmptyDOMElement();
    expect(warn).not.toHaveBeenCalled();
  });
});
