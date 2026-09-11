import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router";

import { MotionProvider } from "@/lib/motion";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import Styleguide from "@/routes/styleguide";
import { applyThemeToElement, resolveTheme } from "@/themes/apply-theme";
import { themePresets } from "@/themes/theme-presets";
import {
  SCALAR_TOKENS,
  THEME_PRESET_NAMES,
  THEME_TOKENS,
  cssVariableName,
  type Theme,
} from "@/themes/theme-types";
import { testConfig, testContent } from "../fixtures/tenant";
import type { SelectProps } from "@/components/ui/Select";

// Test preview state here; real Radix keyboard interactions are covered in the browser audit.
vi.mock("@/components/ui/Select", async () => {
  const { useFieldControlProps } = await import("@/components/ui/FormField");
  return {
    Select: ({ value, defaultValue, onValueChange, options }: SelectProps) => (
      <select
        {...useFieldControlProps()}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
  };
});

const config = {
  ...testConfig,
  theme: {
    ...testConfig.theme,
    overrides: {
      primary: "180 45% 22%",
      radius: "1.25rem",
      fontHeading: '"Preview Fixture", serif',
    },
  },
};
const tenantLabel = `This tenant (${config.theme.preset})`;
let originalStyle: string | null;

beforeEach(() => {
  originalStyle = document.documentElement.getAttribute("style");
  document.documentElement.removeAttribute("style");
});

afterEach(() => {
  cleanup();
  if (originalStyle === null) document.documentElement.removeAttribute("style");
  else document.documentElement.setAttribute("style", originalStyle);
  vi.restoreAllMocks();
});

function renderStyleguide(strict = false) {
  const page = (
    <TenantProvider config={config} content={testContent}>
      <MotionProvider>
        <MemoryRouter>
          <Styleguide />
        </MemoryRouter>
      </MotionProvider>
    </TenantProvider>
  );
  return render(strict ? <StrictMode>{page}</StrictMode> : page);
}

async function selectPreview(label: string) {
  const option = screen.getByRole("option", { name: label }) as HTMLOptionElement;
  const select = screen.getByRole("combobox", { name: "Preview a preset" });
  fireEvent.change(select, { target: { value: option.value } });
  expect(select).toHaveValue(option.value);
}

function expectTheme(theme: Theme) {
  for (const token of THEME_TOKENS) {
    const property = cssVariableName(token);
    expect(document.documentElement.style.getPropertyValue(property), token).toBe(theme[token]);
    expect(document.documentElement.style.getPropertyPriority(property), token).toBe("");
  }
  for (const token of SCALAR_TOKENS) {
    const term = screen.getByText(token, { selector: "dt" });
    expect(term.nextElementSibling?.tagName).toBe("DD");
    expect(term.nextElementSibling?.textContent, token).toBe(theme[token]);
  }
}

function tokenSnapshot() {
  const style = document.documentElement.style;
  const properties = Array.from(style);
  return THEME_TOKENS.map((token) => {
    const property = cssVariableName(token);
    return {
      property,
      present: properties.includes(property),
      value: style.getPropertyValue(property),
      priority: style.getPropertyPriority(property),
    };
  });
}

describe("styleguide theme preview", () => {
  it("starts with the tenant's overrides in both inline tokens and scalar rows", () => {
    renderStyleguide();
    expectTheme(resolveTheme(config.theme));
    expect(screen.getByRole("combobox", { name: "Preview a preset" })).toHaveTextContent(
      tenantLabel,
    );
  });

  it("updates every scalar row and inline token when changing between presets", async () => {
    const before = structuredClone(config.theme);
    renderStyleguide();

    for (const name of THEME_PRESET_NAMES) {
      await selectPreview(name);
      expectTheme(themePresets[name]);
    }
    expect(config.theme).toEqual(before);
  });

  it("resets to the tenant including overrides, not just its base preset", async () => {
    renderStyleguide();
    await selectPreview("classic-academic");
    await selectPreview(config.theme.preset);
    expectTheme(themePresets[config.theme.preset]);

    await selectPreview(tenantLabel);
    expectTheme(resolveTheme(config.theme));

    await selectPreview("corporate-academy");
    expectTheme(themePresets["corporate-academy"]);
  });

  it.each([false, true])(
    "restores original values, priorities and absent tokens on unmount (StrictMode: %s)",
    async (strict) => {
      const style = document.documentElement.style;
      THEME_TOKENS.forEach((token, index) => {
        if (index % 3 !== 0) {
          style.setProperty(
            cssVariableName(token),
            `original-${index}`,
            index % 2 ? "important" : "",
          );
        }
      });
      style.setProperty("--unrelated", "before", "important");
      style.setProperty("overflow", "hidden", "important");
      const unrelatedPriority = style.getPropertyPriority("--unrelated");
      const before = tokenSnapshot();
      const { unmount } = renderStyleguide(strict);

      await selectPreview("premium-university");
      expectTheme(themePresets["premium-university"]);
      await selectPreview(tenantLabel);
      expectTheme(resolveTheme(config.theme));
      await selectPreview("primary-school");
      expectTheme(themePresets["primary-school"]);
      expect(style.getPropertyValue("--unrelated")).toBe("before");
      expect(style.getPropertyPriority("--unrelated")).toBe(unrelatedPriority);
      expect(style.getPropertyValue("overflow")).toBe("hidden");
      expect(style.getPropertyPriority("overflow")).toBe("important");

      // Other code may change styles while the preview is mounted. Do not roll it back.
      style.setProperty("--unrelated", "after", "important");
      style.setProperty("--new-unrelated", "keep");
      style.setProperty("overflow", "auto");
      unmount();

      expect(tokenSnapshot()).toEqual(before);
      expect(style.getPropertyValue("--unrelated")).toBe("after");
      expect(style.getPropertyPriority("--unrelated")).toBe(unrelatedPriority);
      expect(style.getPropertyValue("--new-unrelated")).toBe("keep");
      expect(style.getPropertyValue("overflow")).toBe("auto");
      expect(style.getPropertyPriority("overflow")).toBe("");
    },
  );

  it("restores the initial inline tokens even without changing the selection", () => {
    document.documentElement.style.setProperty("--primary", "original", "important");
    const before = tokenSnapshot();
    const { unmount } = renderStyleguide();
    unmount();
    expect(tokenSnapshot()).toEqual(before);
  });
});

describe("applyThemeToElement atomicity", () => {
  it.each(["", "   ", "Inter */", "Inter; color: red", undefined])(
    "does not write anything when the last token is invalid: %s",
    (fontBody) => {
      const element = document.createElement("div");
      element.style.setProperty("--background", "original", "important");
      element.style.setProperty("--font-body", "serif", "important");
      element.style.setProperty("--unrelated", "keep");
      element.style.setProperty("overflow", "hidden");
      const before = element.style.cssText;
      const setProperty = vi.spyOn(element.style, "setProperty");
      const invalid = { ...themePresets["modern-campus"], fontBody } as unknown as Theme;

      expect(() => applyThemeToElement(invalid, element)).toThrow();
      expect(setProperty).not.toHaveBeenCalled();
      expect(element.style.cssText).toBe(before);
    },
  );

  it("applies all valid tokens trimmed without touching unrelated inline styles", () => {
    const element = document.createElement("div");
    element.style.setProperty("--unrelated", "keep", "important");
    const unrelatedPriority = element.style.getPropertyPriority("--unrelated");
    const theme = { ...themePresets["classic-academic"], radius: "  2rem  " };
    applyThemeToElement(theme, element);

    for (const token of THEME_TOKENS) {
      expect(element.style.getPropertyValue(cssVariableName(token))).toBe(theme[token].trim());
    }
    expect(element.style.getPropertyValue("--unrelated")).toBe("keep");
    expect(element.style.getPropertyPriority("--unrelated")).toBe(unrelatedPriority);
  });
});
