import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MobileNav } from "@/components/navigation/MobileNav";
import { DesktopNav } from "@/components/navigation/DesktopNav";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { testConfig } from "../fixtures/tenant";
import { renderWithProviders } from "../fixtures/render";

describe("MobileNav drawer", () => {
  it("opens from a labelled trigger", async () => {
    renderWithProviders(<MobileNav />);
    const trigger = screen.getByRole("button", { name: "Open menu" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("is a labelled modal dialog", async () => {
    renderWithProviders(<MobileNav />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("heading", { name: "Menu" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderWithProviders(<MobileNav />);
    const trigger = screen.getByRole("button", { name: "Open menu" });

    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("moves focus into the dialog rather than leaving it on the page behind", async () => {
    renderWithProviders(<MobileNav />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("wraps Tab and Shift+Tab through the real drawer without reaching outside controls", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <button>Before navigation</button>
        <MobileNav />
        <button>After navigation</button>
      </>,
    );
    const before = screen.getByRole("button", { name: "Before navigation" });
    const after = screen.getByRole("button", { name: "After navigation" });
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.tab();
    expect(before).toHaveFocus();
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    const close = within(dialog).getByRole("button", { name: "Close" });
    const links = within(dialog).getAllByRole("link");
    expect(links.length).toBeGreaterThan(1);
    await waitFor(() => expect(close).toHaveFocus());

    // No manual focus placement, focusTrap option or mocked Drawer: every step
    // must move to a distinct control and Radix must wrap at both boundaries.
    for (const expected of [...links, close]) {
      await user.tab();
      expect(expected).toHaveFocus();
      expect(before).not.toHaveFocus();
      expect(after).not.toHaveFocus();
      expect(trigger).not.toHaveFocus();
    }
    for (const expected of [...links].reverse().concat(close)) {
      await user.tab({ shift: true });
      expect(expected).toHaveFocus();
      expect(before).not.toHaveFocus();
      expect(after).not.toHaveFocus();
    }

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.tab();
    expect(after).toHaveFocus();
  });

  it("closes with the labelled close control and can reopen with keyboard focus restored", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNav />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Menu" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard(" ");
    const reopened = await screen.findByRole("dialog", { name: "Menu" });
    await waitFor(() =>
      expect(within(reopened).getByRole("button", { name: "Close" })).toHaveFocus(),
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes when a navigation link is followed", async () => {
    renderWithProviders(<MobileNav />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = await screen.findByRole("dialog");
    const aboutLabel =
      testConfig.navigation.find((item) => item.kind === "page" && item.pageId === "about")
        ?.label ?? testConfig.pages.about.navLabel;
    const aboutLink = within(dialog).getByRole("link", { name: aboutLabel });
    await userEvent.click(aboutLink);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("omits links to pages the tenant has disabled", async () => {
    renderWithProviders(<MobileNav />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const dialog = await screen.findByRole("dialog");
    const hrefs = within(dialog)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    for (const [pageId, page] of Object.entries(testConfig.pages)) {
      if (!page.enabled) {
        expect(hrefs, `a disabled page (${pageId}) must not be linked`).not.toContain(page.path);
      }
    }
  });
});

describe("DesktopNav", () => {
  it("opens a dropdown on click, and does not open on hover alone", async () => {
    renderWithProviders(<DesktopNav />);
    const group = testConfig.navigation.find((item) => item.kind === "group");
    if (group) {
      const trigger = screen.getByRole("button", { name: new RegExp(group.label, "i") });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await userEvent.hover(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    } else {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("closes the dropdown on Escape", async () => {
    renderWithProviders(<DesktopNav />);
    const group = testConfig.navigation.find((item) => item.kind === "group");
    if (group) {
      const trigger = screen.getByRole("button", { name: new RegExp(group.label, "i") });

      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    }
  });

  it("marks the active route with aria-current", () => {
    renderWithProviders(<DesktopNav />, { initialPath: testConfig.pages.about.path });
    const aboutLabel =
      testConfig.navigation.find((item) => item.kind === "page" && item.pageId === "about")
        ?.label ?? testConfig.pages.about.navLabel;
    const active = screen.getByRole("link", { name: aboutLabel });
    expect(active).toHaveAttribute("aria-current", "page");
  });

  it("is a labelled navigation landmark", () => {
    renderWithProviders(<DesktopNav />);
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });
});

describe("AnnouncementBar", () => {
  it("renders the tenant's announcement and its link", () => {
    const { container } = renderWithProviders(<AnnouncementBar />);
    const announcement = testConfig.announcement;
    if (testConfig.features.announcementBar && announcement) {
      expect(screen.getByText(new RegExp(announcement.message))).toBeInTheDocument();
      if (announcement.link) {
        expect(screen.getByRole("link", { name: announcement.link.label })).toBeInTheDocument();
      }
    } else {
      expect(container.firstChild).toBeNull();
    }
  });

  it("can be dismissed, and stays dismissed", async () => {
    const { container } = renderWithProviders(<AnnouncementBar />);
    if (testConfig.features.announcementBar && testConfig.announcement) {
      await userEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));

      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: "Dismiss announcement" }),
        ).not.toBeInTheDocument(),
      );
    } else {
      expect(container.firstChild).toBeNull();
    }
  });
});

describe("SiteFooter", () => {
  it("shows the tenant's demonstration-content notice when present", () => {
    renderWithProviders(<SiteFooter />);
    if (testConfig.legal.demoContentNotice) {
      expect(screen.getByText(testConfig.legal.demoContentNotice)).toBeInTheDocument();
    } else {
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    }
  });

  it("gives every external link rel=noopener noreferrer", () => {
    renderWithProviders(<SiteFooter />);
    const externals = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("http"));

    expect(externals.length).toBeGreaterThan(0);
    for (const link of externals) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
