import { statSync } from "node:fs";
import { extname, join } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { FormId } from "@/config/form-config";
import { config, content } from "@/site";
import { PAGE_IDS, type PageId } from "@/config/tenant-schema";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { TenantPage } from "@/routes/page-content";
import { createRouteManifest, detailPath } from "@/routes/route-manifest";
import { withDetailContent, type TenantModule } from "../fixtures/route-content";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DEMO_NOTICE = "Demonstration only. Nothing was submitted to a server.";
const pageFormIds: Partial<Record<PageId, FormId[]>> = {
  conversion: ["conversionEnquiry"],
  newsEvents: ["newsletter"],
  contact: ["generalEnquiry", "consultation"],
};

function expectedFormIds(tenant: TenantModule, pageId: PageId) {
  return (pageFormIds[pageId] ?? []).filter(
    (formId) =>
      tenant.config.integrations.forms[formId].enabled &&
      (formId !== "newsletter" || tenant.config.features.newsletterSignup),
  );
}

function expectContactLinks(element: HTMLElement, tenant: TenantModule) {
  const scope = within(element);
  expect(scope.getByRole("link", { name: tenant.config.contact.email })).toHaveAttribute(
    "href",
    `mailto:${tenant.config.contact.email}`,
  );
  expect(scope.getByRole("link", { name: tenant.config.contact.phone })).toHaveAttribute(
    "href",
    `tel:${tenant.config.contact.phone.replace(/[^+\d]/g, "")}`,
  );
}

function expectDemoForm(form: HTMLElement, tenant: TenantModule, formId: FormId) {
  const settings = tenant.config.integrations.forms[formId];
  const scope = within(form);
  expect(settings.endpoint).toBeUndefined();
  expect(form).toHaveAccessibleName();
  if (tenant.config.legal.demoContentNotice) {
    expect(form).toHaveAccessibleDescription(
      `${tenant.config.legal.demoContentNotice} ${DEMO_NOTICE}`,
    );
    expect(scope.getByText(tenant.config.legal.demoContentNotice)).toBeVisible();
    expect(scope.getByText(DEMO_NOTICE)).toBeVisible();
    expect(
      scope.getByRole("button", { name: settings.submitLabel ?? "Validate demonstration" }),
    ).toBeEnabled();
  } else {
    expect(
      scope.getByRole("button", { name: settings.submitLabel ?? "Send request" }),
    ).toBeEnabled();
  }
  for (const input of scope.getAllByRole("textbox")) {
    expect(input).toHaveAccessibleName();
    expect(input).toBeEnabled();
  }
  expectContactLinks(form, tenant);
}

function page(tenant: TenantModule, path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <TenantProvider {...tenant}>
        <TenantPage />
      </TenantProvider>
    </MemoryRouter>
  );
}

describe("usable configured pages", () => {
  const tenant: TenantModule = { config, content };

  it.each(PAGE_IDS)(
    "renders %s with one H1, honest content and registered routes or supplied downloads",
    (pageId) => {
      const configuredPage = tenant.config.pages[pageId];
      const { container } = render(page(tenant, configuredPage.path));
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      if (!configuredPage.enabled) {
        expect(screen.getByRole("heading", { name: "404 — Page not found" })).toBeInTheDocument();
        return;
      }
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        pageId === "home" ? tenant.config.brand.name : configuredPage.navLabel,
      );
      if (tenant.config.legal.demoContentNotice) {
        const pageNotices = screen
          .getAllByText(tenant.config.legal.demoContentNotice)
          .filter((notice) => !notice.closest("form"));
        expect(pageNotices).toHaveLength(1);
        expect(pageNotices[0]).toBeVisible();
      }
      const formIds = expectedFormIds(tenant, pageId);
      const forms = screen.queryAllByRole("form");
      expect(forms).toHaveLength(formIds.length);
      expect(container.querySelectorAll("form")).toHaveLength(formIds.length);
      for (const [index, formId] of formIds.entries()) {
        expectDemoForm(forms[index]!, tenant, formId);
      }
      for (const image of container.querySelectorAll("img")) {
        expect(image.getAttribute("src")).toMatch(/^\/tenants\//);
        expect(image).toHaveAttribute("width");
        expect(image).toHaveAttribute("height");
      }
      const validPaths = createRouteManifest(tenant.config, tenant.content).map(
        (entry) => entry.path,
      );
      for (const anchor of container.querySelectorAll("a[href^='/']")) {
        const href = anchor.getAttribute("href")!;
        if (anchor.hasAttribute("download")) {
          const download = tenant.content.downloads.find((item) => item.file === href);
          expect(download).toBeDefined();
          expect(tenant.config.contentSources.downloads).toBe("local");
          expect(extname(href)).toBe(`.${download!.fileType}`);
          const file = statSync(join(process.cwd(), "public", href.slice(1)));
          expect(file.isFile()).toBe(true);
          expect(file.size).toBeGreaterThan(0);
        } else {
          // Collection pagination targets real on-page card anchors, not new routes.
          const [path, fragment] = href.split("#");
          expect(validPaths).toContain(path);
          if (fragment !== undefined) {
            expect(path).toBe(configuredPage.path);
            const target = document.getElementById(decodeURIComponent(fragment));
            expect(target).not.toBeNull();
            expect(container).toContainElement(target);
          }
        }
      }
      if (pageId === "downloads" && tenant.config.contentSources.downloads === "local") {
        for (const download of tenant.content.downloads) {
          const link = screen.getByRole("link", { name: `Download ${download.title}` });
          expect(link).toHaveAttribute("href", download.file);
          expect(link).toHaveAttribute("download");
        }
      }
      expect(container).not.toHaveTextContent("Page sections arrive in the next phase");
    },
  );

  it("has static content on every public route without hydration or a network request", () => {
    for (const entry of createRouteManifest(tenant.config, tenant.content)) {
      const markup = renderToStaticMarkup(page(tenant, entry.path));
      const element = document.createElement("div");
      element.innerHTML = markup;
      expect(element.querySelectorAll("h1")).toHaveLength(1);
      expect(element.querySelector("h1")?.textContent).toBe(entry.title);
      if (tenant.config.legal.demoContentNotice) {
        expect(element.textContent).toContain(tenant.config.legal.demoContentNotice);
      }
      expect(element.textContent).not.toContain("404 — Page not found");
      const forms = element.querySelectorAll("form");
      expect(forms).toHaveLength(
        entry.kind === "page" ? expectedFormIds(tenant, entry.pageId).length : 0,
      );
      for (const form of forms) {
        expect(form).not.toHaveAttribute("action");
        if (tenant.config.legal.demoContentNotice) {
          expect(form.textContent).toContain(DEMO_NOTICE);
        }
        expect(form.querySelector("noscript")?.textContent).toContain(
          "JavaScript is required to validate and send this form. Nothing was submitted.",
        );
        expect(form.querySelector("fieldset")).toBeDisabled();
        for (const control of form.querySelectorAll("input, textarea, button")) {
          expect(control).toBeDisabled();
          expect(control).not.toHaveAttribute("formaction");
        }
        expectContactLinks(form, tenant);
      }
    }
  });
  it("uses an explicitly configured section array while preserving the page heading", () => {
    const fixture: TenantModule = {
      ...tenant,
      content: {
        ...tenant.content,
        pageSections: {
          about: [
            {
              type: "finalCTA",
              id: "configured-cta",
              heading: "Configured composition",
              actions: [{ label: "Talk to us", href: tenant.config.pages.contact.path }],
            },
          ],
        },
      },
    };
    render(page(fixture, tenant.config.pages.about.path));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tenant.config.pages.about.navLabel,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Configured composition" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Talk to us" })).toHaveAttribute(
      "href",
      tenant.config.pages.contact.path,
    );
  });

  it("links from home to each program and renders its supplied body and highlights", () => {
    render(page(tenant, "/"));
    const listing = within(
      screen.getByRole("region", { name: tenant.config.terminology.programPlural }),
    );
    for (const program of tenant.content.programs) {
      expect(listing.getByRole("link", { name: program.name })).toHaveAttribute(
        "href",
        detailPath(tenant.config, "programs", program.slug),
      );
    }
    cleanup();
    for (const program of tenant.content.programs) {
      render(page(tenant, detailPath(tenant.config, "programs", program.slug)));
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(program.name);
      for (const text of [...program.body, ...program.highlights])
        expect(screen.getByText(text)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Entry requirements, fees and application deadlines have not been supplied/,
        ),
      ).toBeInTheDocument();
      cleanup();
    }
  });

  it("offers email/phone fallbacks, supplied FAQs and a safe no-endpoint demonstration form", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Unexpected request"));
    render(page(tenant, tenant.config.pages.conversion.path));
    expectContactLinks(
      screen.getByRole("region", { name: tenant.config.pages.contact.navLabel }),
      tenant,
    );
    const form = screen.getByRole("form", {
      name: tenant.config.terminology.primaryConversionLabel,
    });
    expectDemoForm(form, tenant, "conversionEnquiry");
    const notice = tenant.content.pageSections?.conversion?.find(
      (section) => section.id === "conversion-notice",
    );
    if (notice?.type !== "announcementBar") {
      throw new Error("The conversion fixture must supply its non-submission notice.");
    }
    expect(screen.getByText(notice.message)).toBeVisible();
    for (const faq of tenant.content.faqs) {
      expect(screen.getByRole("button", { name: faq.question })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: faq.question }));
      for (const answer of faq.answer) expect(screen.getByText(answer)).toBeVisible();
    }
    const sampleValues: Record<string, string> = {
      name: "Example visitor",
      email: "visitor@example.org",
      phone: "+44 7700 900123",
      message: "Sample enquiry only.",
      program: "Example offering",
      organisation: "Example organisation",
    };
    for (const input of within(form).getAllByRole("textbox")) {
      const value = sampleValues[input.getAttribute("name")!];
      expect(value).toBeDefined();
      fireEvent.change(input, { target: { value } });
    }
    const consent = within(form).queryByRole("checkbox");
    if (consent) fireEvent.click(consent);
    fireEvent.submit(form);
    if (tenant.config.legal.demoContentNotice) {
      expect(within(form).getByRole("status")).toHaveTextContent(DEMO_NOTICE);
      expect(within(form).queryByRole("alert")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
      expectContactLinks(form, tenant);
      expect(
        screen.queryByText(tenant.config.integrations.forms.conversionEnquiry.successMessage),
      ).not.toBeInTheDocument();
    } else {
      expect(within(form).getByRole("status")).toHaveTextContent(
        tenant.config.integrations.forms.conversionEnquiry.successMessage,
      );
      expect(within(form).queryByRole("alert")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
      expectContactLinks(form, tenant);
    }
  });

  it.each(["privacy", "terms", "policies"] as const)(
    "does not manufacture %s or imply that a configured date is legal text",
    (pageId) => {
      const fixture = structuredClone(tenant);
      fixture.content.policies = [];
      render(page(fixture, fixture.config.pages[pageId].path));
      expect(screen.getByText(/This legal text has not been supplied/)).toBeInTheDocument();
      expect(
        screen.queryByText(/By using this website|we collect your|accept these terms/i),
      ).not.toBeInTheDocument();
      expect(document.querySelector("time")).toBeNull();
    },
  );

  it("renders news, event and person bodies and safely escapes plain-text content", () => {
    const fixture = withDetailContent(tenant);
    for (const collection of ["news", "events", "people"] as const) {
      const item = fixture.content[collection][0]!;
      const { container } = render(
        page(fixture, detailPath(fixture.config, collection, item.slug)),
      );
      const body = "bio" in item ? item.bio : item.body;
      for (const paragraph of body) expect(screen.getByText(paragraph)).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "title" in item ? item.title : item.name,
      );
      if (collection === "news") expect(container.querySelector("strong")).toBeNull();
      if (collection === "events") {
        expect(screen.getByText("Online")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Registration information/ })).toHaveAttribute(
          "rel",
          "noopener noreferrer",
        );
      }
      cleanup();
    }
  });

  it("renders 404 for unknown slugs and unrecognized pages rather than an empty listing", () => {
    for (const path of [
      "/unknown",
      `${tenant.config.pages.programs.path}/unknown-slug`,
      "/about/extra",
    ]) {
      render(page(tenant, path));
      expect(screen.getByRole("heading", { name: "404 — Page not found" })).toBeInTheDocument();
      cleanup();
    }
  });
});

describe("content-specific rendering", () => {
  it("links a department only to its own programs and each program back to it", async () => {
    const tenant: TenantModule = { config, content };
    const department = tenant.content.departments[0]!;
    const related = tenant.content.programs.filter(
      (program) => program.departmentSlug === department.slug,
    );
    const unrelated = tenant.content.programs.filter(
      (program) => program.departmentSlug !== department.slug,
    );
    expect(related.length).toBeGreaterThan(0);
    expect(unrelated.length).toBeGreaterThan(0);
    render(page(tenant, detailPath(tenant.config, "departments", department.slug)));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(department.name);
    expect(screen.getByText(department.body[0]!)).toBeInTheDocument();
    for (const program of related) {
      expect(screen.getByRole("link", { name: program.name })).toHaveAttribute(
        "href",
        detailPath(tenant.config, "programs", program.slug),
      );
    }
    for (const program of unrelated) {
      expect(screen.queryByRole("link", { name: program.name })).not.toBeInTheDocument();
    }
    cleanup();
    for (const program of related) {
      render(page(tenant, detailPath(tenant.config, "programs", program.slug)));
      expect(screen.getByRole("link", { name: department.name })).toHaveAttribute(
        "href",
        detailPath(tenant.config, "departments", department.slug),
      );
      cleanup();
    }
  });

  it("renders supplied legal text only for its structural policy slug, even on a renamed path", async () => {
    const tenant = structuredClone({ config, content });
    tenant.config.pages.privacy.path = "/data-notice";
    tenant.content.policies = [
      {
        slug: "privacy",
        title: "Supplied privacy text",
        body: ["Approved copy supplied by the tenant."],
        updatedAt: "2026-09-05",
      },
    ];
    render(page(tenant, "/data-notice"));
    expect(screen.getByText("Approved copy supplied by the tenant.")).toBeInTheDocument();
    expect(screen.getByText("2026-09-05")).toHaveAttribute("dateTime", "2026-09-05");
    cleanup();
    render(page(tenant, tenant.config.pages.terms.path));
    expect(screen.queryByText("Approved copy supplied by the tenant.")).not.toBeInTheDocument();
    expect(screen.getByText(/legal text has not been supplied/)).toBeInTheDocument();
  });

  it("hides disabled-source content and its links without hiding the enabled page", async () => {
    const tenant = structuredClone({ config, content });
    tenant.config.contentSources.programs = "none";
    render(page(tenant, tenant.config.pages.programs.path));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      tenant.config.pages.programs.navLabel,
    );
    expect(
      screen.getByText(
        `No ${tenant.config.terminology.programPlural.toLowerCase()} have been supplied. Use the contact details to ask for current information.`,
      ),
    ).toBeVisible();
    for (const program of tenant.content.programs)
      expect(screen.queryByRole("link", { name: program.name })).not.toBeInTheDocument();
  });

  it("does not expose disabled pages in the home exploration links", async () => {
    const tenant = structuredClone({ config, content });
    tenant.config.pages.gallery.enabled = false;
    const quickLinks = tenant.content.pageSections?.home?.find((s) => s.id === "quick-links");
    if (quickLinks) quickLinks.enabled = true;
    render(page(tenant, "/"));
    const navigation = within(screen.getByRole("region", { name: "Explore" }));
    expect(
      navigation.getByRole("link", { name: tenant.config.terminology.primaryConversionLabel }),
    ).toHaveAttribute("href", tenant.config.pages.conversion.path);
    expect(tenant.config.pages.gallery.enabled).toBe(false);
    expect(
      navigation.queryByRole("link", { name: tenant.config.pages.gallery.navLabel }),
    ).not.toBeInTheDocument();
  });
});
