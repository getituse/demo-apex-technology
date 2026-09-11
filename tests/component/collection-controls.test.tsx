import type { ReactNode } from "react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PaginatedCollection } from "@/components/collections/PaginatedCollection";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { DetailContent, DetailPage } from "@/routes/detail-content";
import { collectionRoutes, createRouteManifest, detailPath } from "@/routes/route-manifest";
import {
  DownloadsSection,
  EventsGridSection,
  NewsGridSection,
} from "@/sections/CollectionSections";
import type {
  DownloadCardData,
  NewsCardData,
  SectionComponentProps,
} from "@/sections/section-types";
import { config, content } from "@/site";
import { withDetailContent, type TenantModule } from "../fixtures/route-content";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const newsItems: NewsCardData[] = Array.from({ length: 7 }, (_, index) => ({
  id: `update-${index + 1}`,
  title: `Update ${index + 1}`,
  summary: `Summary ${index + 1}`,
  date: "2026-09-01",
  category: index % 2 ? "Briefings" : "Updates",
  isDemoContent: false,
  action: { label: `Update ${index + 1}`, href: `/news/update-${index + 1}` },
}));

const newsSection: SectionComponentProps<"newsGrid">["section"] = {
  type: "newsGrid",
  heading: "Latest updates",
  emptyMessage: "No updates are available.",
  items: newsItems,
};

const eventsSection: SectionComponentProps<"eventsGrid">["section"] = {
  type: "eventsGrid",
  heading: "Upcoming dates",
  emptyMessage: "No dates are available.",
  items: newsItems.map(({ date: _date, ...item }) => ({
    ...item,
    startsAt: "2026-10-01T10:00:00Z",
    location: "Online",
  })),
};

function LocationProbe() {
  const { pathname, search, hash } = useLocation();
  return (
    <p role="note" aria-label="Current location">
      {pathname + search + hash}
    </p>
  );
}

function wrapped(children: ReactNode) {
  return (
    <MemoryRouter initialEntries={["/updates?keep=value"]}>
      <TenantProvider config={config} content={content}>
        {children}
        <LocationProbe />
      </TenantProvider>
    </MemoryRouter>
  );
}

function renderNews(
  listing: { pageSize: number; categoryFiltering: boolean } = {
    pageSize: 2,
    categoryFiltering: true,
  },
  items = newsItems,
) {
  return render(wrapped(<NewsGridSection section={{ ...newsSection, listing, items }} />));
}

function visibleTitles(label = "Latest updates results") {
  return within(screen.getByRole("list", { name: label }))
    .queryAllByRole("heading")
    .map((heading) => heading.textContent);
}

describe("hydration-only collection controls", () => {
  it.each(["news", "events"] as const)("leaves %s grids unchanged without listing", (kind) => {
    render(
      wrapped(
        kind === "news" ? (
          <NewsGridSection section={newsSection} />
        ) : (
          <EventsGridSection section={eventsSection} />
        ),
      ),
    );
    expect(screen.getAllByRole("article")).toHaveLength(7);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each([1, 2, 3, 100])("honors page size %i without enabling category controls", (pageSize) => {
    renderNews({ pageSize, categoryFiltering: false });
    expect(visibleTitles()).toHaveLength(Math.min(pageSize, newsItems.length));
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent(`of ${newsItems.length} results`);
    if (pageSize >= newsItems.length) expect(screen.queryByRole("navigation")).toBeNull();
    // Hidden records remain in the DOM and retain their canonical card links.
    expect(screen.getAllByRole("article", { hidden: true })).toHaveLength(newsItems.length);
  });

  it("pages with the keyboard, announces counts, and focuses results without changing the URL", async () => {
    renderNews();
    const results = screen.getByRole("list", { name: "Latest updates results" });
    expect(results).not.toHaveFocus();
    const pager = screen.getByRole("navigation", { name: "Latest updates pagination" });
    within(pager).getByRole("button", { name: "Next" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(visibleTitles()).toEqual(["Update 3", "Update 4"]);
    expect(results).toHaveFocus();
    expect(results).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("status")).toHaveTextContent("Showing 3–4 of 7 results. Page 2 of 4.");
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/updates?keep=value");
    expect(within(pager).getByText("2")).toHaveAttribute("aria-current", "page");
    within(pager).getByRole("button", { name: "4" }).focus();
    await userEvent.keyboard(" ");
    expect(visibleTitles()).toEqual(["Update 7"]);
    expect(results).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 7–7 of 7 results. Page 4 of 4.");
    expect(within(pager).queryByRole("button", { name: "Next" })).toBeNull();
    await userEvent.click(within(pager).getByRole("button", { name: "Previous" }));
    expect(visibleTitles()).toEqual(["Update 5", "Update 6"]);
    expect(results).toHaveFocus();
    expect(screen.getByLabelText("Current location")).toHaveTextContent(/^\/updates\?keep=value$/);
  });

  it.each(["Control", "Meta"])(
    "uses local buttons without fragment URLs for context, middle, or %s clicks",
    async (modifier) => {
      const user = userEvent.setup();
      renderNews();
      const pager = screen.getByRole("navigation", { name: "Latest updates pagination" });
      const results = screen.getByRole("list", { name: "Latest updates results" });
      expect(within(pager).queryAllByRole("link")).toEqual([]);
      expect(pager.querySelector("a, [href]")).toBeNull();
      for (const button of within(pager).getAllByRole("button")) {
        expect(button.tagName).toBe("BUTTON");
        expect(button).toHaveAttribute("type", "button");
      }
      for (const item of results.children) expect(item).not.toHaveAttribute("id");
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-controls", results.id);
      expect(results).toHaveAttribute("aria-describedby", screen.getByRole("status").id);

      const next = within(pager).getByRole("button", { name: "Next" });
      await user.pointer([
        { target: next, keys: "[MouseRight]" },
        { target: next, keys: "[MouseMiddle]" },
      ]);
      expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
      await user.keyboard(`{${modifier}>}`);
      await user.click(next);
      await user.keyboard(`{/${modifier}}`);
      expect(visibleTitles()).toEqual(["Update 3", "Update 4"]);
      expect(results).toHaveFocus();
      expect(screen.getByLabelText("Current location")).toHaveTextContent(
        /^\/updates\?keep=value$/,
      );
    },
  );

  it("filters with a labelled native select and resets to page one on a category change", async () => {
    renderNews();
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    const select = screen.getByRole("combobox", { name: "Filter Latest updates by category" });
    expect(select.tagName).toBe("SELECT");
    await userEvent.selectOptions(select, "Briefings");
    expect(visibleTitles()).toEqual(["Update 2", "Update 4"]);
    expect(select).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 1–2 of 3 results");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(visibleTitles()).toEqual(["Update 6"]);
    await userEvent.selectOptions(select, "");
    expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
    expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 4");
  });

  it("resets changed datasets and page sizes, but keeps equivalent rerenders on the same page", async () => {
    const listing = { pageSize: 2, categoryFiltering: true };
    const { rerender } = renderNews(listing);
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    rerender(
      wrapped(<NewsGridSection section={{ ...newsSection, listing, items: [...newsItems] }} />),
    );
    expect(visibleTitles()).toEqual(["Update 7"]);
    rerender(
      wrapped(
        <NewsGridSection section={{ ...newsSection, listing, items: newsItems.slice(0, 3) }} />,
      ),
    );
    expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
    expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 2");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    rerender(
      wrapped(
        <NewsGridSection section={{ ...newsSection, listing: { ...listing, pageSize: 3 } }} />,
      ),
    );
    expect(visibleTitles()).toEqual(["Update 1", "Update 2", "Update 3"]);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    rerender(
      wrapped(
        <NewsGridSection
          section={{
            ...newsSection,
            listing: { ...listing, pageSize: 3 },
            items: newsItems.map((item) => ({ ...item, title: `${item.title} revised` })),
          }}
        />,
      ),
    );
    expect(visibleTitles()).toEqual(["Update 1 revised", "Update 2 revised", "Update 3 revised"]);
  });

  it("clamps an out-of-range page if a category getter changes the matching set", async () => {
    let categories = new Map(newsItems.map((item) => [item.id, "Updates"]));
    const view = () =>
      wrapped(
        <PaginatedCollection
          items={newsItems}
          label="Records"
          emptyMessage="No records."
          pageSize={2}
          categoryFiltering
          getCategory={(item) => categories.get(item.id)}
          renderItem={(item) => <h3>{item.title}</h3>}
        />,
      );
    const { rerender } = render(view());
    await userEvent.selectOptions(screen.getByRole("combobox"), "Updates");
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    categories = new Map([["update-1", "Updates"]]);
    rerender(view());
    expect(visibleTitles("Records results")).toEqual(["Update 1"]);
    expect(screen.getByRole("status")).toHaveTextContent("Page 1 of 1");
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("offers a clear action for a now-empty selection without trapping keyboard focus", async () => {
    const listing = { pageSize: 2, categoryFiltering: true };
    const { rerender } = renderNews(listing);
    await userEvent.selectOptions(screen.getByRole("combobox"), "Briefings");
    rerender(
      wrapped(
        <NewsGridSection
          section={{
            ...newsSection,
            listing,
            items: newsItems.filter((item) => item.category === "Updates"),
          }}
        />,
      ),
    );
    expect(screen.getByText("No results match this category.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0–0 of 0 results");
    expect(visibleTitles()).toEqual([]);
    const clear = screen.getByRole("button", { name: "Clear category filter" });
    clear.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("button", { name: "Clear category filter" })).toBeNull();
    expect(screen.getByRole("list", { name: "Latest updates results" })).toHaveFocus();
    expect(visibleTitles()).toEqual(["Update 1", "Update 3"]);
  });

  it("clears a previous category when filtering is disabled", async () => {
    const { rerender } = renderNews();
    await userEvent.selectOptions(screen.getByRole("combobox"), "Briefings");
    rerender(
      wrapped(
        <NewsGridSection
          section={{ ...newsSection, listing: { pageSize: 2, categoryFiltering: false } }}
        />,
      ),
    );
    expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("of 7 results");
  });

  it("renders an honest empty collection with no inert filter or pager", () => {
    renderNews(undefined, []);
    expect(screen.getByText(newsSection.emptyMessage)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0–0 of 0 results");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("filters events, includes legacy uncategorized records, and isolates two section instances", async () => {
    const listing = { pageSize: 2, categoryFiltering: true };
    render(
      wrapped(
        <>
          <NewsGridSection section={{ ...newsSection, listing }} />
          <EventsGridSection
            section={{
              ...eventsSection,
              listing,
              variant: "list",
              items: eventsSection.items.map((item, index) =>
                index ? item : { ...item, category: undefined },
              ),
            }}
          />
        </>,
      ),
    );
    const newsSelect = screen.getByRole("combobox", { name: "Filter Latest updates by category" });
    const eventSelect = screen.getByRole("combobox", { name: "Filter Upcoming dates by category" });
    expect(newsSelect.id).not.toBe(eventSelect.id);
    await userEvent.selectOptions(eventSelect, "Uncategorized");
    expect(visibleTitles("Upcoming dates results")).toEqual(["Update 1"]);
    expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
    await userEvent.selectOptions(eventSelect, "Briefings");
    expect(visibleTitles("Upcoming dates results")).toEqual(["Update 2", "Update 4"]);
    await userEvent.click(
      within(screen.getByRole("navigation", { name: "Upcoming dates pagination" })).getByRole(
        "button",
        { name: "Next" },
      ),
    );
    expect(visibleTitles("Upcoming dates results")).toEqual(["Update 6"]);
    expect(visibleTitles()).toEqual(["Update 1", "Update 2"]);
    expect(screen.getByRole("list", { name: "Upcoming dates results" }).className).not.toContain(
      "sm:grid-cols-2",
    );
  });

  it.each(["news", "events"] as const)(
    "keeps ALL %s links visible in no-JS server HTML, with no dead pagination",
    (kind) => {
      const listing = { pageSize: 1, categoryFiltering: true };
      const html = renderToString(
        wrapped(
          kind === "news" ? (
            <NewsGridSection section={{ ...newsSection, listing }} />
          ) : (
            <EventsGridSection section={{ ...eventsSection, listing }} />
          ),
        ),
      );
      const element = document.createElement("div");
      element.innerHTML = html;
      expect(element.querySelectorAll("article")).toHaveLength(7);
      expect(
        element.querySelector("[hidden], select, nav, button, a[href*='#collection-']"),
      ).toBeNull();
      for (const item of newsItems) {
        expect(element.querySelector(`a[href="${item.action!.href}"]`)).not.toBeNull();
      }
    },
  );

  it("hydrates full server HTML without mismatch or initial focus, then hides off-page cards", async () => {
    const node = wrapped(
      <NewsGridSection
        section={{ ...newsSection, listing: { pageSize: 2, categoryFiltering: true } }}
      />,
    );
    const element = document.createElement("div");
    element.innerHTML = renderToString(node);
    document.body.append(element);
    const recoverableError = vi.fn();
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(element, node, { onRecoverableError: recoverableError });
      });
      expect(recoverableError).not.toHaveBeenCalled();
      expect(focus).not.toHaveBeenCalled();
      expect(within(element).getAllByRole("article")).toHaveLength(2);
      expect(element.querySelectorAll("article")).toHaveLength(7);
    } finally {
      await act(async () => root?.unmount());
      element.remove();
    }
  });

  it("escapes category text rather than interpreting HTML in controls, status, or cards", async () => {
    const category = '</option><img src="x" onerror="alert(1)">';
    const items = [{ ...newsItems[0]!, category }, ...newsItems.slice(1)];
    const { container } = renderNews(undefined, items);
    await userEvent.selectOptions(screen.getByRole("combobox"), category);
    expect(visibleTitles()).toEqual(["Update 1"]);
    expect(screen.getByRole("status")).toHaveTextContent(category);
    expect(container.querySelector("img, script")).toBeNull();
    const html = renderToString(wrapped(<NewsGridSection section={{ ...newsSection, items }} />));
    expect(html).toContain("&lt;/option&gt;&lt;img");
    expect(html).not.toContain('<img src="x"');
  });
});

const files: DownloadCardData["fileType"][] = ["pdf", "doc", "docx", "xls", "xlsx", "zip"];
const downloads: SectionComponentProps<"downloads">["section"] = {
  type: "downloads",
  heading: "Resources",
  emptyMessage: "No resources available.",
  items: files.map((fileType, index) => ({
    id: `file-${index}`,
    title: `Resource ${index}`,
    file: `/resources/file-${index}.${fileType}`,
    fileType,
    fileSizeKb: 128 + index,
    updatedAt: "2026-09-01",
    ...(index < 4 ? { category: index % 2 ? "Reference" : "Guides" } : {}),
  })),
};

describe("grouped downloads", () => {
  it.each(["h1", "h2", "h3"] as const)(
    "nests category and card headings correctly below %s",
    (headingLevel) => {
      render(wrapped(<DownloadsSection section={downloads} headingLevel={headingLevel} />));
      const level = Number(headingLevel.slice(1));
      expect(screen.getByRole("heading", { name: "Resources", level })).toBeVisible();
      expect(screen.getAllByRole("heading", { level: level + 1 })).toHaveLength(3);
      expect(screen.getAllByRole("heading", { level: level + 2 })).toHaveLength(6);
      expect(
        within(screen.getByRole("region", { name: "Guides" })).getAllByRole("article"),
      ).toHaveLength(2);
      expect(
        within(screen.getByRole("region", { name: "Other resources" })).getAllByRole("article"),
      ).toHaveLength(2);
    },
  );

  it("preserves file type, MIME type, measured size and download links in each group", () => {
    render(wrapped(<DownloadsSection section={{ ...downloads, variant: "list" }} />));
    for (const item of downloads.items) {
      const card = screen.getByRole("article", { name: item.title });
      const link = within(card).getByRole("link", { name: `Download ${item.title}` });
      expect(link).toHaveAttribute("download");
      expect(link).toHaveAttribute("href", item.file);
      expect(link.getAttribute("type")).toMatch(/^application\//);
      expect(within(card).getByText(item.fileType.toUpperCase())).toBeVisible();
      expect(within(card).getByText(`${item.fileSizeKb} KB`)).toBeVisible();
      expect(link).toHaveAccessibleDescription(
        new RegExp(`${item.fileType.toUpperCase()}.*${item.fileSizeKb} KB`),
      );
    }
  });

  it("groups prototype-like and unsafe categories as plain text without mutating input", () => {
    const category = '<script>alert("x")</script>';
    const items = [
      { ...downloads.items[0]!, category },
      { ...downloads.items[1]!, category: "__proto__" },
    ];
    const before = structuredClone(items);
    const { container } = render(wrapped(<DownloadsSection section={{ ...downloads, items }} />));
    expect(screen.getByRole("heading", { name: category })).toBeVisible();
    expect(screen.getByRole("heading", { name: "__proto__" })).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
    expect(items).toEqual(before);
  });

  it("shows the configured empty state without invented groups", () => {
    render(wrapped(<DownloadsSection section={{ ...downloads, items: [] }} />));
    expect(screen.getByText(downloads.emptyMessage)).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Other resources" })).toBeNull();
  });
});

function relatedFixture(): TenantModule {
  const tenant = withDetailContent({ config, content });
  tenant.config.detailRoutes = {
    ...tenant.config.detailRoutes,
    news: { enabled: true, path: "/bulletins", aliases: ["/old-news"] },
    events: { enabled: true, path: "/dates", aliases: ["/old-events"] },
  };
  tenant.content.news = Array.from({ length: 6 }, (_, index) => ({
    ...tenant.content.news[0]!,
    slug: `update-${index}`,
    title: `News record ${index}`,
    category: [0, 2, 4].includes(index) ? "Updates" : "Briefings",
  }));
  tenant.content.events = Array.from({ length: 6 }, (_, index) => ({
    ...tenant.content.events[0]!,
    slug: `date-${index}`,
    title: `Event record ${index}`,
    category: [0, 2, 4].includes(index) ? "Updates" : "Briefings",
  }));
  return tenant;
}

function detailView(tenant: TenantModule, path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <TenantProvider {...tenant}>
        <DetailPage />
      </TenantProvider>
    </MemoryRouter>
  );
}

describe.each(["news", "events"] as const)("related %s", (collection) => {
  it("prioritizes matching categories, excludes self, caps at three and links canonically even from an alias", () => {
    const tenant = relatedFixture();
    const records = tenant.content[collection];
    const path = `${collection === "news" ? "/old-news" : "/old-events"}/${records[0]!.slug}`;
    render(detailView(tenant, path));
    const heading = screen.getByRole("heading", { name: `Related ${collection}`, level: 2 });
    const related = within(heading.parentElement!);
    const expected = [records[2]!, records[4]!, records[1]!];
    expect(related.getAllByRole("link").map((link) => link.textContent)).toEqual(
      expected.map((item) => item.title),
    );
    for (const item of expected) {
      expect(related.getByRole("link", { name: item.title })).toHaveAttribute(
        "href",
        detailPath(tenant.config, collection, item.slug),
      );
    }
    expect(related.queryByRole("link", { name: records[0]!.title })).toBeNull();
    expect(related.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it.each(["parent", "source", "details"] as const)(
    "does not surface related links when the %s gate disables the collection",
    (gate) => {
      const tenant = relatedFixture();
      const entry = collectionRoutes(
        createRouteManifest(tenant.config, tenant.content),
        collection,
      )[0]!;
      if (gate === "parent") tenant.config.pages.newsEvents.enabled = false;
      if (gate === "source") tenant.config.contentSources[collection] = "none";
      if (gate === "details") tenant.config.detailRoutes![collection]!.enabled = false;
      const routes = createRouteManifest(tenant.config, tenant.content);
      expect(collectionRoutes(routes, collection)).toEqual([]);
      // Even a retained record rendering with the newly gated manifest cannot emit related links.
      render(
        <MemoryRouter>
          <TenantProvider {...tenant}>
            <DetailContent entry={entry} routes={routes} />
          </TenantProvider>
        </MemoryRouter>,
      );
      expect(screen.queryByRole("heading", { name: `Related ${collection}` })).toBeNull();
      cleanup();
      render(detailView(tenant, entry.path));
      expect(screen.getByRole("heading", { name: "404 — Page not found" })).toBeVisible();
    },
  );

  it("omits the related block for a singleton and uses current content on rerender", () => {
    const tenant = relatedFixture();
    const entry = collectionRoutes(
      createRouteManifest(tenant.config, tenant.content),
      collection,
    )[0]!;
    const { rerender } = render(detailView(tenant, entry.path));
    const next = structuredClone(tenant);
    if (collection === "news") next.content.news = next.content.news.slice(0, 1);
    else next.content.events = next.content.events.slice(0, 1);
    rerender(detailView(next, entry.path));
    expect(screen.queryByRole("heading", { name: `Related ${collection}` })).toBeNull();
  });
});
