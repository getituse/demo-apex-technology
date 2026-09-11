import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { MotionProvider } from "@/lib/motion";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { testConfig, testContent } from "./tenant";

/**
 * Renders a component inside the providers it expects in the real app: a router (so
 * Link and NavLink work), the tenant config, and the motion feature set.
 *
 * `MemoryRouter`, not `createMemoryRouter`: the data router builds a real `Request` on
 * navigation, and Node's fetch rejects jsdom's `AbortSignal` as a foreign object. That
 * surfaced as an unhandled rejection which failed the run while every test passed.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { initialPath?: string },
): RenderResult {
  const { initialPath = "/", ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TenantProvider config={testConfig} content={testContent}>
        <MotionProvider>
          <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        </MotionProvider>
      </TenantProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
