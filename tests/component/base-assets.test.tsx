import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DownloadCard } from "@/components/cards/DownloadCard";
import { ResponsiveImage } from "@/components/media/Image";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { CardLink } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { assetUrl } from "@/lib/asset-url";

afterEach(() => vi.unstubAllEnvs());

describe("base-aware assets", () => {
  it.each([
    [undefined, "/images/cover.jpg"],
    ["", "/images/cover.jpg"],
    ["/", "/images/cover.jpg"],
    ["/repo/", "/repo/images/cover.jpg"],
    ["/repo", "/repo/images/cover.jpg"],
    ["/repo/nested/", "/repo/nested/images/cover.jpg"],
  ])("prefixes root assets using BASE_URL %s", (base, expected) => {
    vi.stubEnv("BASE_URL", base);
    expect(assetUrl("/images/cover.jpg")).toBe(expected);
  });

  it.each([
    "https://cdn.example.com/image.jpg",
    "http://localhost/image.jpg",
    "//cdn.example.com/image.jpg",
    "data:image/png;base64,aGVsbG8=",
    "blob:https://example.com/example-id",
    "#details",
    "mailto:hello@example.com",
    "tel:+123456789",
    "images/cover.jpg",
    "",
  ])("leaves non-root-local input unchanged: %s", (src) => {
    vi.stubEnv("BASE_URL", "/repo/");
    expect(assetUrl(src)).toBe(src);
  });

  it("preserves asset suffixes and treats inputs as app-relative", () => {
    vi.stubEnv("BASE_URL", "/repo/");
    expect(assetUrl("/")).toBe("/repo/");
    expect(assetUrl("/images/cover.jpg?v=2#preview")).toBe("/repo/images/cover.jpg?v=2#preview");
    expect(assetUrl("/repo/cover.jpg")).toBe("/repo/repo/cover.jpg");
  });

  it.each(["/", "/repo/", "/repo/nested/"])(
    "prefixes every responsive image candidate at %s",
    (base) => {
      vi.stubEnv("BASE_URL", base);
      const { container } = render(
        <ResponsiveImage
          src="/images/cover.jpg"
          alt="Cover illustration"
          width={1280}
          height={720}
          srcSetWidths={[640, 1280]}
          formats={["avif", "webp"]}
          sizes="(max-width: 640px) 100vw, 640px"
          priority
        />,
      );
      const image = screen.getByRole("img", { name: "Cover illustration" });
      expect(image).toHaveAttribute("src", `${base}images/cover.jpg`);
      expect(image).toHaveAttribute(
        "srcset",
        `${base}images/cover-640.jpg 640w, ${base}images/cover-1280.jpg 1280w`,
      );
      expect(image).toHaveAttribute("width", "1280");
      expect(image).toHaveAttribute("height", "720");
      expect(image).toHaveAttribute("loading", "eager");
      expect(image).toHaveAttribute("fetchpriority", "high");
      for (const format of ["avif", "webp"]) {
        expect(container.querySelector(`source[type="image/${format}"]`)).toHaveAttribute(
          "srcset",
          `${base}images/cover-640.${format} 640w, ${base}images/cover-1280.${format} 1280w`,
        );
      }
    },
  );

  it("prefixes format sources without widths and does not invent other formats", () => {
    vi.stubEnv("BASE_URL", "/repo/");
    const { container } = render(
      <ResponsiveImage
        src="/images/cover.jpg"
        alt=""
        width={1280}
        height={720}
        formats={["webp"]}
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute("src", "/repo/images/cover.jpg");
    expect(container.querySelector("img")).not.toHaveAttribute("srcset");
    expect(container.querySelector("source")).toHaveAttribute("srcset", "/repo/images/cover.webp");
    expect(container.querySelectorAll("source")).toHaveLength(1);
  });

  it.each(["https://cdn.example.com/cover.jpg", "data:image/png;base64,aGVsbG8="])(
    "preserves an image source that is not app-local: %s",
    (src) => {
      vi.stubEnv("BASE_URL", "/repo/");
      const { container } = render(
        <ResponsiveImage src={src} alt="Cover" width={800} height={600} />,
      );
      expect(screen.getByRole("img")).toHaveAttribute("src", src);
      expect(container.querySelector("source")).toBeNull();
    },
  );

  it.each(["/", "/repo/"])("prefixes a native download without needing a router at %s", (base) => {
    vi.stubEnv("BASE_URL", base);
    render(
      <DownloadCard
        item={{
          id: "guide",
          title: "Guide",
          file: "/documents/guide.pdf",
          fileType: "pdf",
          fileSizeKb: 12,
          updatedAt: "2026-09-09",
        }}
      />,
    );
    const download = screen.getByRole("link", { name: "Download Guide" });
    expect(download).toHaveAttribute("href", `${base}documents/guide.pdf`);
    expect(download).toHaveAttribute("download");
    expect(download).toHaveAttribute("type", "application/pdf");
  });

  it("prefixes native local links but never double-prefixes Router links", () => {
    vi.stubEnv("BASE_URL", "/repo/");
    render(
      <MemoryRouter basename="/repo" initialEntries={["/repo/"]}>
        <LinkButton href="/about">About button</LinkButton>
        <CardLink href="/about">About card</CardLink>
        <NavItemLink link={{ href: "/about", label: "About navigation", isExternal: false }} />
        <LinkButton href="/documents/guide.pdf" isExternal>
          Native button
        </LinkButton>
        <CardLink href="/documents/guide.pdf" isExternal>
          Native card
        </CardLink>
        <LinkButton href="https://example.com/about" isExternal>
          External button
        </LinkButton>
        <CardLink href="https://example.com/about" isExternal>
          External card
        </CardLink>
      </MemoryRouter>,
    );
    for (const name of ["About button", "About card", "About navigation"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", "/repo/about");
    }
    for (const name of ["Native button", "Native card"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        "/repo/documents/guide.pdf",
      );
      expect(screen.getByRole("link", { name })).toHaveAttribute("rel", "noopener noreferrer");
    }
    for (const name of ["External button", "External card"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        "https://example.com/about",
      );
    }
  });
});
