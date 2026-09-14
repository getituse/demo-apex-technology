import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { inflateSync } from "node:zlib";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { config } from "@/site";
import { PLACEHOLDER_IMAGE_FILES } from "@/lib/placeholder-media";
import { themePresets } from "@/themes/theme-presets";
import { resolveTheme } from "@/themes/apply-theme";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const fontAssets = JSON.parse(
  readFileSync(path.join(publicRoot, "fonts/font-assets.json"), "utf8"),
) as {
  fonts: {
    family: string;
    subset: string;
    file: string;
    bytes: number;
    sha512: string;
    unicodeRange: string;
    license: string;
  }[];
};
const hostedFamilies = new Set(fontAssets.fonts.map((font) => font.family));
const systemFamilies = new Set([
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Arial",
  "sans-serif",
  "serif",
  "ui-rounded",
  "Arial Rounded MT Bold",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Times",
  "Palatino Linotype",
  "Book Antiqua",
  "Palatino",
]);

function families(stack: string) {
  return stack.split(",").map((name) => name.trim().replace(/^['"]|['"]$/g, ""));
}

function expectSystemStack(stack: string) {
  for (const family of families(stack)) {
    expect(systemFamilies.has(family), `Non-system font family: ${family}`).toBe(true);
  }
  expect(families(stack).at(-1)).toMatch(/^(serif|sans-serif)$/);
}

function expectHostedStack(stack: string) {
  const [primary, ...fallbacks] = families(stack);
  expect(hostedFamilies.has(primary ?? ""), stack).toBe(true);
  expectSystemStack(fallbacks.join(","));
}

function assetFile(url: string, tenantId: string = config.id) {
  expect(url.startsWith(`/tenants/${tenantId}/`), url).toBe(true);
  expect(url).not.toMatch(/\.\.|[\\?#]/);
  return path.join(publicRoot, url.slice(1));
}

function readSvg(file: string) {
  const source = readFileSync(file, "utf8");
  const document = new DOMParser().parseFromString(source, "image/svg+xml");
  expect(document.querySelector("parsererror"), file).toBeNull();
  expect(document.documentElement.localName, file).toBe("svg");
  expect(document.documentElement.getAttribute("viewBox"), file).toMatch(/^0 0 \d+ \d+$/);
  expect(document.querySelector("title")?.textContent, file).toMatch(/demo/i);
  expect(document.querySelector("desc")?.textContent, file).toMatch(/original demo artwork/i);
  expect(document.querySelector("script, image, foreignObject, style, use"), file).toBeNull();
  // SVG's xmlns URI is an identifier, not an external resource. Resource attributes are banned.
  for (const element of document.querySelectorAll("*")) {
    for (const attribute of element.attributes) {
      expect(attribute.localName, file).not.toMatch(/^on|href$/i);
      expect(attribute.value, file).not.toMatch(/url\s*\(|@import|@font-face/i);
    }
    const font = element.getAttribute("font-family");
    if (font) expectSystemStack(font);
  }
  return document;
}

function expectPng(file: string, width: number, height: number) {
  const bytes = readFileSync(file);
  expect(bytes.subarray(0, 8).toString("hex"), file).toBe("89504e470d0a1a0a");
  expect(bytes.toString("ascii", 12, 16)).toBe("IHDR");
  expect(bytes.readUInt32BE(16)).toBe(width);
  expect(bytes.readUInt32BE(20)).toBe(height);
  expect(bytes[24]).toBe(8); // Chromium emits 8-bit RGB or RGBA PNGs.
  expect([2, 6]).toContain(bytes[25]);
  expect(bytes[28]).toBe(0); // Non-interlaced.
  const data: Buffer[] = [];
  let offset = 8;
  let end = false;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    expect(offset + length + 12).toBeLessThanOrEqual(bytes.length);
    if (type === "IDAT") data.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
    if (type === "IEND") {
      end = true;
      break;
    }
  }
  expect(end, file).toBe(true);
  expect(offset).toBe(bytes.length);
  expect(data.length).toBeGreaterThan(0);
  // Verify the actual compressed image payload, not a renamed SVG or header-only PNG.
  const pixels = inflateSync(Buffer.concat(data));
  expect(pixels.length).toBe(height * (1 + width * (bytes[25] === 6 ? 4 : 3)));
  expect(new Set(pixels).size, `${file}: blank image`).toBeGreaterThan(8);
}

describe("offline tenant media", () => {
  it("ships every configured asset file and directory", () => {
    const id = config.id;
    const files = [
      config.brand.logo,
      config.brand.logoMark,
      config.brand.logoDark,
      config.brand.favicon,
      config.seo.ogImage,
      config.assets.socialShareImage,
      config.assets.manifestIcon,
    ];
    for (const url of files) {
      const file = assetFile(url, id);
      expect(statSync(file).isFile(), url).toBe(true);
      expect(statSync(file).size, url).toBeGreaterThan(100);
    }
    for (const url of [config.assets.basePath, config.assets.images, config.assets.documents]) {
      expect(url === `/tenants/${id}` || url.startsWith(`/tenants/${id}/`), url).toBe(true);
      expect(statSync(path.join(publicRoot, url.slice(1))).isDirectory(), url).toBe(true);
    }
  });

  it("has accessible, self-contained original SVG sources", () => {
    const id = config.id;
    for (const url of [
      config.brand.logo,
      config.brand.logoMark,
      config.brand.logoDark,
      config.brand.favicon,
      `${config.assets.basePath}/social-share.svg`,
      `${config.assets.images}/demo-artwork.svg`,
    ]) {
      readSvg(assetFile(url, id));
    }
    const artwork = readSvg(assetFile(`${config.assets.images}/demo-artwork.svg`, id));
    expect(artwork.querySelector("text")).toBeNull(); // Hero artwork contains no baked-in copy.
    const share = readSvg(assetFile(`${config.assets.basePath}/social-share.svg`, id));
    expect(share.documentElement.textContent).toContain("Demonstration website");
    expect(share.documentElement.textContent).toContain("not real premises");
    expect(readFileSync(assetFile(config.brand.logoDark, id), "utf8")).not.toBe(
      readFileSync(assetFile(config.brand.logo, id), "utf8"),
    );
  });

  it("ships real social-share and manifest PNGs", () => {
    const id = config.id;
    expectPng(assetFile(config.seo.ogImage, id), 1200, 630);
    expectPng(assetFile(config.assets.socialShareImage, id), 1200, 630);
    expectPng(assetFile(config.assets.manifestIcon, id), 512, 512);
  });

  it("satisfies the existing placeholder image filenames", () => {
    const id = config.id;
    for (const name of Object.values(PLACEHOLDER_IMAGE_FILES)) {
      const bytes = readFileSync(assetFile(`${config.assets.images}/${name}`, id));
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      expect(bytes.length).toBeGreaterThan(1000);
      expect(bytes.length).toBeLessThan(500_000);
    }
  });
});

describe("self-hosted original typography", () => {
  it.each(Object.keys(themePresets) as (keyof typeof themePresets)[])(
    "%s uses shipped font families with system and generic fallbacks",
    (name) => {
      expectHostedStack(themePresets[name].fontHeading);
      expectHostedStack(themePresets[name].fontBody);
    },
  );

  it("resolves to shipped fonts rather than remote dependencies", () => {
    const theme = resolveTheme(config.theme);
    expectHostedStack(theme.fontHeading);
    expectHostedStack(theme.fontBody);
  });

  it("retains editorial serif and friendly rounded-sans intent", () => {
    for (const name of ["classic-academic", "premium-university"] as const) {
      expect(families(themePresets[name].fontHeading).at(-1)).toBe("serif");
    }
    expect(families(themePresets["primary-school"].fontHeading)[0]).toBe("Nunito");
    expect(families(themePresets["primary-school"].fontHeading)).toContain("Trebuchet MS");
    for (const name of ["modern-campus", "green-campus", "corporate-academy"] as const) {
      expect(families(themePresets[name].fontHeading).at(-1)).toBe("sans-serif");
    }
  });

  it("does not import or download third-party fonts in application source", () => {
    const sourceRoot = path.join(root, "src");
    for (const name of readdirSync(sourceRoot, { recursive: true, encoding: "utf8" })) {
      if (!/\.(?:css|[cm]?[jt]sx?)$/.test(name)) continue;
      const source = readFileSync(path.join(sourceRoot, name), "utf8");
      expect(source, name).not.toMatch(
        /@fontsource|fonts\.(?:googleapis|gstatic)\.com|(?:https?:)?\/\/[^\s"'<>]+\.(?:woff2?|ttf|otf)\b|@import\s+(?:url\(\s*)?["']?(?:https?:)?\/\//i,
      );
    }
  });

  it("ships all six original families, with variable Latin and extended subsets and licenses", () => {
    expect([...hostedFamilies].sort()).toEqual([
      "Inter",
      "Lexend",
      "Lora",
      "Nunito",
      "Source Sans 3",
      "Source Serif 4",
    ]);
    expect(fontAssets.fonts).toHaveLength(12);
    for (const family of hostedFamilies) {
      expect(
        fontAssets.fonts
          .filter((font) => font.family === family)
          .map((font) => font.subset)
          .sort(),
      ).toEqual(["latin", "latin-ext"]);
    }
    for (const font of fontAssets.fonts) {
      expect(font.file).toMatch(/^[a-z0-9]+\/latin(?:-ext)?-wght\.woff2$/);
      const bytes = readFileSync(path.join(publicRoot, "fonts", font.file));
      expect(bytes.toString("ascii", 0, 4)).toBe("wOF2");
      expect(bytes.readUInt32BE(8)).toBe(bytes.length);
      expect(bytes.length).toBe(font.bytes);
      expect(createHash("sha512").update(bytes).digest("base64")).toBe(font.sha512);
      expect(font.license).toMatch(/^[a-z0-9]+\/OFL\.txt$/);
      const license = readFileSync(path.join(publicRoot, "fonts", font.license), "utf8");
      expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
      expect(license).toMatch(/Copyright/i);
    }
  });

  it("matches every CSS face to the real file, weights, unicode subset and swap policy", () => {
    const faces: Record<string, string>[] = [];
    postcss
      .parse(readFileSync(path.join(root, "src/styles/fonts.css"), "utf8"))
      .walkAtRules("font-face", (rule) => {
        const declarations: Record<string, string> = {};
        rule.walkDecls((decl) => {
          declarations[decl.prop] = decl.value;
        });
        faces.push(declarations);
      });
    expect(faces).toHaveLength(fontAssets.fonts.length);
    for (const font of fontAssets.fonts) {
      const matches = faces.filter((face) => face.src?.includes(`/fonts/${font.file}`));
      expect(matches, font.file).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        "font-family": `"${font.family}"`,
        "font-style": "normal",
        "font-weight": "400 700",
        "font-display": "swap",
      });
      expect(matches[0]?.["unicode-range"]?.replace(/\s/g, "")).toBe(
        font.unicodeRange.replace(/\s/g, ""),
      );
      expect(matches[0]?.src).not.toMatch(/https?:|local\(/);
    }
    expect(readFileSync(path.join(root, "src/root.tsx"), "utf8")).toContain(
      'import "./styles/fonts.css"',
    );
  });
});
