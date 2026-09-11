import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { useLocation } from "react-router";

import { Accordion } from "@/components/ui/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Card, CardLink, CardTitle } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Stat } from "@/components/ui/Stat";
import { Textarea } from "@/components/ui/Textarea";
import { renderWithProviders } from "../fixtures/render";

describe("Button", () => {
  it("renders a real button element", () => {
    renderWithProviders(<Button>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" }).tagName).toBe("BUTTON");
  });

  it('defaults to type="button" so it cannot submit a form by accident', () => {
    renderWithProviders(<Button>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "button");
  });

  it("keeps an explicit submit type", () => {
    renderWithProviders(<Button type="submit">Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
  });

  it("does not fire when disabled", async () => {
    let clicks = 0;
    renderWithProviders(
      <Button disabled onClick={() => (clicks += 1)}>
        Send
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Send" })).catch(() => undefined);
    expect(clicks).toBe(0);
  });
});

describe("IconButton", () => {
  it("always has an accessible name", () => {
    renderWithProviders(<IconButton label="Close menu" icon={<span>x</span>} />);
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("hides the decorative icon from assistive technology", () => {
    renderWithProviders(<IconButton label="Close menu" icon={<span>x</span>} />);
    const button = screen.getByRole("button", { name: "Close menu" });
    expect(within(button).getByText("x").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});

describe("LinkButton", () => {
  it("renders an anchor with a real href, not a button", () => {
    renderWithProviders(<LinkButton href="/about">About</LinkButton>);
    const link = screen.getByRole("link", { name: "About" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/about");
  });

  it("navigates on Enter but not Space and never submits its containing form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    function Location() {
      const { pathname, search, hash } = useLocation();
      return <p role="status">{pathname + search + hash}</p>;
    }
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <LinkButton href="/about?source=cta#details">About</LinkButton>
        <Location />
      </form>,
    );
    const link = screen.getByRole("link", { name: "About" });
    expect(link).not.toHaveAttribute("role", "button");
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("status").textContent).toBe("/");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status").textContent).toBe("/about?source=cta#details");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks external links as noopener noreferrer", () => {
    renderWithProviders(
      <LinkButton href="https://example.com" isExternal>
        External
      </LinkButton>,
    );
    const link = screen.getByRole("link", { name: "External" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("Accordion keyboard", () => {
  const items = [
    { id: "first", question: "First question", answer: "First answer" },
    { id: "second", question: "Second question", answer: "Second answer" },
    { id: "third", question: "Third question", answer: "Third answer" },
  ];

  it("moves between triggers with arrows, Home and End without opening panels", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });
    const third = screen.getByRole("button", { name: "Third question" });
    await user.tab();
    expect(first).toHaveFocus();
    const steps = [
      ["{ArrowDown}", second],
      ["{ArrowDown}", third],
      ["{ArrowDown}", first],
      ["{ArrowUp}", third],
      ["{ArrowUp}", second],
      ["{Home}", first],
      ["{End}", third],
    ] as const;
    for (const [key, expected] of steps) {
      await user.keyboard(key);
      expect(expected).toHaveFocus();
      for (const trigger of [first, second, third]) {
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
      expect(screen.queryByRole("region")).toBeNull();
    }
  });

  it("opens with Enter, switches with Space and collapses the single open panel", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });
    await user.tab();
    await user.keyboard("{Enter}");
    const region = screen.getByRole("region", { name: "First question" });
    expect(region).toBeVisible();
    expect(region).toHaveTextContent("First answer");
    expect(first).toHaveAttribute("aria-controls", region.id);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(second).toHaveFocus();
    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "First question" })).toBeNull();
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Second question" })).toHaveTextContent(
      "Second answer",
    );
    await user.keyboard("{Enter}");
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("keeps other panels open in multiple mode when toggling one with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} type="multiple" defaultOpenIds={["first"]} />);
    const first = screen.getByRole("button", { name: "First question" });
    const second = screen.getByRole("button", { name: "Second question" });
    expect(screen.getByRole("region", { name: "First question" })).toBeVisible();
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(second).toHaveFocus();
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("region")).toHaveLength(2);
    await user.keyboard("{ArrowUp} ");
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Second question" })).toBeVisible();
  });
});

describe("Card", () => {
  it("is not itself interactive", () => {
    renderWithProviders(
      <Card>
        <CardTitle>Plain</CardTitle>
      </Card>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("exposes exactly one tab stop when it carries a CardLink", () => {
    renderWithProviders(
      <Card interactive>
        <CardTitle>
          <CardLink href="/news/one">Headline</CardLink>
        </CardTitle>
      </Card>,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/news/one");
  });
});

describe("FormField", () => {
  it("associates the label with the control", () => {
    renderWithProviders(
      <FormField label="Full name">
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("announces the description and the error through aria-describedby", () => {
    renderWithProviders(
      <FormField label="Email" description="We reply within a day." error="Enter a valid email.">
        <Input />
      </FormField>,
    );

    const input = screen.getByLabelText(/Email/);
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(" ").filter(Boolean);

    expect(ids).toHaveLength(2);
    expect(input).toHaveAttribute("aria-invalid", "true");
    for (const id of ids) {
      expect(document.getElementById(id)).toBeTruthy();
    }
  });

  it("marks a required field for screen readers as well as sighted users", () => {
    renderWithProviders(
      <FormField label="Name" required>
        <Input />
      </FormField>,
    );
    expect(screen.getByLabelText(/required/)).toBeRequired();
  });

  it("wires a textarea the same way", () => {
    renderWithProviders(
      <FormField label="Message">
        <Textarea />
      </FormField>,
    );
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
  });

  it("refuses to render a control outside a field, rather than losing its label", () => {
    // Rendered without the router on purpose: React Router's error boundary would
    // catch the throw and the test would pass for the wrong reason.
    expect(() => render(<Input />)).toThrow(/inside <FormField>/);
  });
});

describe("Breadcrumbs", () => {
  it("marks the last crumb as the current page and does not link it", () => {
    renderWithProviders(
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "News", href: "/news-events" },
          { label: "Article" },
        ]}
      />,
    );

    expect(screen.getByText("Article")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Article" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});

describe("Pagination", () => {
  it("marks the current page and links the others", () => {
    renderWithProviders(
      <Pagination currentPage={2} totalPages={3} buildHref={(page) => `?page=${page}`} />,
    );

    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/?page=1");
    expect(screen.getByRole("link", { name: "3" })).toHaveAttribute("href", "/?page=3");
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("rel", "prev");
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("rel", "next");
    expect(screen.queryByRole("link", { name: "2" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("preserves router navigation when no callback is supplied", async () => {
    function Location() {
      const { pathname, search } = useLocation();
      return <p role="status">{pathname + search}</p>;
    }
    renderWithProviders(
      <>
        <Pagination currentPage={2} totalPages={3} buildHref={(page) => `?page=${page}`} />
        <Location />
      </>,
      { initialPath: "/records?page=2" },
    );
    await userEvent.click(screen.getByRole("link", { name: "Next" }));
    expect(screen.getByRole("status")).toHaveTextContent("/records?page=3");
    await userEvent.click(screen.getByRole("link", { name: "Previous" }));
    expect(screen.getByRole("status")).toHaveTextContent("/records?page=1");
    await userEvent.click(screen.getByRole("link", { name: "3" }));
    expect(screen.getByRole("status")).toHaveTextContent("/records?page=3");
  });

  it("uses accessible non-submitting buttons for callbacks without needing a router or URLs", async () => {
    const onPageChange = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Pagination
          currentPage={2}
          totalPages={3}
          onPageChange={onPageChange}
          label="Record pages"
          previousLabel="Earlier"
          nextLabel="Later"
        />
      </form>,
    );
    const pager = screen.getByRole("navigation", { name: "Record pages" });
    expect(within(pager).queryByRole("link")).toBeNull();
    expect(pager.querySelector("a, [href]")).toBeNull();
    const current = within(pager).getByText("2");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
    expect(current).toHaveClass("bg-primary", "text-primary-foreground");
    expect(current).not.toHaveAttribute("tabindex");
    for (const button of within(pager).getAllByRole("button")) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveClass("h-11", "min-w-11", "text-primary", "focus-visible:ring-ring");
    }
    await userEvent.tab();
    expect(within(pager).getByRole("button", { name: "Earlier" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    within(pager).getByRole("button", { name: "3" }).focus();
    await userEvent.keyboard(" ");
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(within(pager).getByRole("button", { name: "Later" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await userEvent.click(current);
    expect(onPageChange).toHaveBeenCalledTimes(3);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not build or expose hrefs when a callback overrides link mode", async () => {
    const buildHref = vi.fn((page: number) => `/records?page=${page}`);
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        buildHref={buildHref}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByRole("navigation").querySelector("a, [href]")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);
    expect(buildHref).not.toHaveBeenCalled();
  });

  it.each(["links", "buttons"] as const)(
    "keeps boundary labels inert and full contrast in %s mode",
    async (mode) => {
      const onPageChange = vi.fn();
      const navigation =
        mode === "buttons" ? { onPageChange } : { buildHref: (page: number) => `?page=${page}` };
      const { rerender } = renderWithProviders(
        <Pagination currentPage={1} totalPages={3} {...navigation} />,
      );
      for (const [page, label] of [
        [1, "Previous"],
        [3, "Next"],
      ] as const) {
        rerender(<Pagination currentPage={page} totalPages={3} {...navigation} />);
        const boundary = screen.getByText(label);
        expect(boundary.tagName).toBe("SPAN");
        expect(boundary).toHaveAttribute("aria-hidden", "true");
        expect(boundary).not.toHaveAttribute("tabindex");
        expect(boundary).not.toHaveAttribute("href");
        expect(boundary).toHaveClass("bg-surface", "text-muted-foreground", "border-border");
        expect(boundary.className).not.toMatch(/opacity-/);
        expect(screen.queryByRole("button", { name: label })).toBeNull();
        expect(screen.queryByRole("link", { name: label })).toBeNull();
        await userEvent.click(boundary);
      }
      expect(onPageChange).not.toHaveBeenCalled();
    },
  );

  it("renders nothing for a single page in button mode", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.querySelector("nav")).toBeNull();
  });

  it("renders nothing when there is only one page", () => {
    const { container } = renderWithProviders(
      <Pagination currentPage={1} totalPages={1} buildHref={() => "#"} />,
    );
    expect(container.querySelector("nav")).toBeNull();
  });
});

describe("Stat", () => {
  it("labels a demonstration figure as one", () => {
    renderWithProviders(<Stat label="Founded" value="1998" isDemoContent />);
    expect(screen.getByText("Sample figure")).toBeInTheDocument();
  });

  it("says nothing extra for a verified figure", () => {
    renderWithProviders(<Stat label="Founded" value="1998" isDemoContent={false} />);
    expect(screen.queryByText("Sample figure")).not.toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("is announced as a busy status region", () => {
    renderWithProviders(<LoadingState label="Loading results" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(within(status).getByText("Loading results")).toBeInTheDocument();
  });
});
