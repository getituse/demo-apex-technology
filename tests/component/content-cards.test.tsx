import type { ReactElement } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  ContentCardView,
  DepartmentCard,
  DownloadCard,
  EventCard,
  FacultyCard,
  FacilityCard,
  NewsCard,
  ProgramCard,
  ServiceCard,
  TeamCard,
  TestimonialCard,
} from "@/components/cards";
import type { ContentCardData, DownloadCardData, SectionImage } from "@/sections/section-types";
import { renderWithProviders } from "../fixtures/render";

const image: SectionImage = {
  src: "/images/example.svg",
  alt: "A work area",
  width: 640,
  height: 480,
  focalPoint: "top",
};

const baseItem: ContentCardData = {
  id: "example",
  title: "Practical design",
  summary: "Explore ideas through guided projects.",
  isDemoContent: true,
};

const downloadItem: DownloadCardData = {
  id: "guide",
  title: "Reference guide",
  summary: "An overview of the available options.",
  file: "/downloads/guide.pdf",
  fileType: "pdf",
  fileSizeKb: 128,
  updatedAt: "2026-09-08",
};

type CardExample = (item: ContentCardData, demoLabel?: string) => ReactElement;
const claimCards: [string, CardExample][] = [
  ["ContentCardView", (item, demoLabel) => <ContentCardView item={item} demoLabel={demoLabel} />],
  ["ProgramCard", (item, demoLabel) => <ProgramCard item={item} demoLabel={demoLabel} />],
  [
    "ServiceCard",
    (item, demoLabel) => (
      <ServiceCard item={{ ...item, deliverables: ["Written plan"] }} demoLabel={demoLabel} />
    ),
  ],
  ["DepartmentCard", (item, demoLabel) => <DepartmentCard item={item} demoLabel={demoLabel} />],
  [
    "NewsCard",
    (item, demoLabel) => (
      <NewsCard item={{ ...item, date: "2026-09-08", category: "Updates" }} demoLabel={demoLabel} />
    ),
  ],
  [
    "EventCard",
    (item, demoLabel) => (
      <EventCard
        item={{ ...item, startsAt: "2026-09-08T14:30:00Z", location: "Main room" }}
        demoLabel={demoLabel}
      />
    ),
  ],
  [
    "FacultyCard",
    (item, demoLabel) => (
      <FacultyCard item={{ ...item, role: "Tutor", credentials: [] }} demoLabel={demoLabel} />
    ),
  ],
  [
    "TeamCard",
    (item, demoLabel) => (
      <TeamCard item={{ ...item, role: "Director", credentials: [] }} demoLabel={demoLabel} />
    ),
  ],
  [
    "TestimonialCard",
    (item, demoLabel) => (
      <TestimonialCard
        item={{
          id: item.id,
          author: item.title,
          quote: item.summary,
          role: "Participant",
          image: item.image,
          isDemoContent: item.isDemoContent,
        }}
        demoLabel={demoLabel}
      />
    ),
  ],
  [
    "FacilityCard",
    (item, demoLabel) => (
      <FacilityCard item={{ ...item, features: ["Flexible desks"] }} demoLabel={demoLabel} />
    ),
  ],
];

describe.each(claimCards)("%s", (_name, createCard) => {
  it("renders a named article, one level-three heading and a visible demo marker", () => {
    renderWithProviders(createCard(baseItem));
    const article = screen.getByRole("article", { name: baseItem.title });
    expect(within(article).getByRole("heading", { level: 3, name: baseItem.title })).toBeVisible();
    expect(within(article).getByText(baseItem.summary)).toBeVisible();
    expect(within(article).getByText("Sample content")).toBeVisible();
    expect(within(article).queryByRole("link")).not.toBeInTheDocument();
    expect(within(article).queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the supplied demo label without marking verified content", () => {
    const { rerender } = renderWithProviders(createCard(baseItem, "Illustrative example"));
    expect(screen.getByText("Illustrative example")).toBeVisible();
    rerender(createCard({ ...baseItem, isDemoContent: false }, "Illustrative example"));
    expect(screen.queryByText("Illustrative example")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample content")).not.toBeInTheDocument();
  });

  it("preserves image dimensions, alt text and focal point without invented sources", () => {
    const { container } = renderWithProviders(createCard({ ...baseItem, image }));
    const img = screen.getByRole("img", { name: image.alt });
    expect(img).toHaveAttribute("src", image.src);
    expect(img).toHaveAttribute("width", "640");
    expect(img).toHaveAttribute("height", "480");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveStyle({ objectPosition: "top" });
    expect(container.querySelector("source")).toBeNull();
  });
});

describe("card actions", () => {
  it.each([
    ["/programs/design", false],
    ["#details", false],
    ["https://example.org/design", true],
    ["mailto:hello@example.org", false],
    ["tel:+441234567890", false],
  ] as const)("renders exactly one safe link for %s", async (href, external) => {
    renderWithProviders(<ProgramCard item={{ ...baseItem, action: { label: "Explore", href } }} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    const link = screen.getByRole("link", { name: "Explore — Practical design" });
    expect(link).toHaveAttribute("href", href);
    expect(link.querySelector("a, button, input, select, textarea")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    if (external) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    } else {
      expect(link).not.toHaveAttribute("target");
    }
    await userEvent.tab();
    expect(link).toHaveFocus();
    await userEvent.tab();
    expect(link).not.toHaveFocus();
  });

  it("keeps decorative images out of the accessible image list", () => {
    renderWithProviders(<ContentCardView item={{ ...baseItem, image: { ...image, alt: "" } }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute("alt", "");
  });

  it("supports section-controlled heading levels", () => {
    renderWithProviders(<ContentCardView item={baseItem} headingTag="h4" />);
    expect(screen.getByRole("heading", { level: 4, name: baseItem.title })).toBeVisible();
  });

  it("does not let a blank custom label hide a demo claim", () => {
    renderWithProviders(<ContentCardView item={baseItem} demoLabel="  " />);
    expect(screen.getByText("Sample content")).toBeVisible();
  });
});

describe("typed card details", () => {
  it("does not invent a midnight start for a date-only event", () => {
    renderWithProviders(
      <EventCard item={{ ...baseItem, startsAt: "2026-09-08", location: "Online" }} />,
    );
    expect(screen.getByText("8 September 2026")).toHaveAttribute("datetime", "2026-09-08");
    expect(screen.queryByText(/00:00 UTC/)).toBeNull();
  });
  it("renders program metadata and highlights", () => {
    renderWithProviders(
      <ProgramCard
        item={{
          ...baseItem,
          duration: "12 weeks",
          level: "Introductory",
          highlights: ["Portfolio"],
        }}
      />,
    );
    expect(screen.getByText("Duration").tagName).toBe("DT");
    expect(screen.getByText("12 weeks").tagName).toBe("DD");
    expect(screen.getByText("Introductory").tagName).toBe("DD");
    expect(within(screen.getByRole("list")).getByText("Portfolio")).toBeVisible();
  });

  it("renders deliverables, a named lead and facility features", () => {
    renderWithProviders(
      <>
        <ServiceCard item={{ ...baseItem, title: "Consulting", deliverables: ["Audit", "Plan"] }} />
        <DepartmentCard item={{ ...baseItem, title: "Design unit", lead: "Alex Rivera" }} />
        <FacilityCard item={{ ...baseItem, title: "Workshop", features: ["Adjustable benches"] }} />
      </>,
    );
    expect(
      within(screen.getByRole("article", { name: "Consulting" })).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(screen.getByText("Alex Rivera").tagName).toBe("DD");
    expect(screen.getByText("Adjustable benches").tagName).toBe("LI");
  });

  it.each([FacultyCard, TeamCard])("renders person roles and credentials", (PersonCard) => {
    renderWithProviders(
      <PersonCard item={{ ...baseItem, role: "Research lead", credentials: ["MSc", "PhD"] }} />,
    );
    expect(screen.getByText("Research lead")).toBeVisible();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["MSc", "PhD"]);
  });

  it("renders a real quotation and attribution without inventing a link", () => {
    renderWithProviders(
      <TestimonialCard
        item={{
          id: "quote",
          quote: "Clear guidance.",
          author: "Alex",
          role: "Participant",
          isDemoContent: false,
        }}
      />,
    );
    expect(screen.getByText("Clear guidance.").closest("blockquote")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Alex" }).closest("figcaption")).not.toBeNull();
    expect(screen.getByText("Participant").closest("figure")).not.toBeNull();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders news dates and offset event timestamps deterministically in UTC", () => {
    renderWithProviders(
      <>
        <NewsCard item={{ ...baseItem, date: "2026-09-08", category: "Updates" }} />
        <EventCard
          item={{ ...baseItem, startsAt: "2026-09-08T00:30:00+02:00", location: "Online" }}
        />
      </>,
    );
    const newsTime = screen.getByText("8 September 2026");
    expect(newsTime.tagName).toBe("TIME");
    expect(newsTime).toHaveAttribute("datetime", "2026-09-08");
    const eventTime = screen.getByText("7 September 2026, 22:30 UTC");
    expect(eventTime.tagName).toBe("TIME");
    expect(eventTime).toHaveAttribute("datetime", "2026-09-08T00:30:00+02:00");
    expect(screen.getByText("Updates")).toBeVisible();
    expect(screen.getByText("Online")).toBeVisible();
  });
});

describe("DownloadCard", () => {
  it("provides one native download with accessible file metadata and no demo claim", () => {
    renderWithProviders(<DownloadCard item={downloadItem} demoLabel="Not applicable" />);
    const article = screen.getByRole("article", { name: downloadItem.title });
    expect(within(article).getByRole("heading", { level: 3 })).toHaveTextContent(
      downloadItem.title,
    );
    const link = screen.getByRole("link", { name: "Download Reference guide" });
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", downloadItem.file);
    expect(link).toHaveAttribute("download");
    expect(link).toHaveAttribute("type", "application/pdf");
    expect(link).not.toHaveAttribute("target");
    expect(link).toHaveAccessibleDescription(/File type PDF Size 128 KB Updated 8 September 2026/);
    expect(screen.getByText("8 September 2026")).toHaveAttribute("datetime", "2026-09-08");
    expect(screen.queryByText("Not applicable")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample content")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports missing summaries and alternate heading levels", () => {
    renderWithProviders(
      <DownloadCard item={{ ...downloadItem, summary: undefined }} headingTag="h2" />,
    );
    expect(screen.getByRole("heading", { level: 2, name: downloadItem.title })).toBeVisible();
    expect(screen.queryByText(downloadItem.summary ?? "")).not.toBeInTheDocument();
  });
});
