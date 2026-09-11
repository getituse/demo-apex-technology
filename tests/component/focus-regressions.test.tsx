import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useState } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DesktopNav } from "@/components/navigation/DesktopNav";
import { Modal } from "@/components/ui/Modal";
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus";
import { RouteAnnouncer } from "@/hooks/use-route-announcement";
import { renderWithProviders } from "../fixtures/render";
import { testConfig } from "../fixtures/tenant";

afterEach(() => vi.restoreAllMocks());

describe("focus regressions", () => {
  it("returns focus from a dropdown child on Escape", async () => {
    renderWithProviders(<DesktopNav />);
    const group = testConfig.navigation.find((item) => item.kind === "group");
    if (group && group.children.length > 0) {
      const trigger = screen.getByRole("button", { name: new RegExp(group.label, "i") });
      await userEvent.click(trigger);
      const childLink = screen.getByRole("link", {
        name: new RegExp(group.children[0]!.label, "i"),
      });
      childLink.focus();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    } else {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("keeps modal positioning separate from its animated surface and restores focus", async () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Launch</button>
          <Modal open={open} onOpenChange={setOpen} title="Example">
            <p>Body</p>
          </Modal>
        </>
      );
    }
    renderWithProviders(<Demo />);
    const trigger = screen.getByRole("button", { name: "Launch" });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Example" });
    expect(dialog).toHaveClass("-translate-x-1/2", "-translate-y-1/2");
    expect(dialog.style.transform).toBe("");
    expect(dialog.firstElementChild?.className).toContain("bg-surface-elevated");
    expect(dialog).not.toHaveAttribute("aria-describedby");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("cancels an old restoration when a dialog reopens", () => {
    let callback: FrameRequestCallback | undefined;
    const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((next) => {
      callback = next;
      return 101;
    });
    let restore = () => {};
    function Harness({ open }: { open: boolean }) {
      restore = useDialogReturnFocus(open);
      return (
        <>
          <button>Trigger</button>
          <div role="dialog">
            <button>Inside</button>
          </div>
        </>
      );
    }
    const { rerender } = render(<Harness open={false} />);
    screen.getByRole("button", { name: "Trigger" }).focus();
    rerender(<Harness open />);
    screen.getByRole("button", { name: "Inside" }).focus();
    rerender(<Harness open={false} />);
    restore();
    rerender(<Harness open />);
    act(() => callback?.(0));
    expect(cancel).toHaveBeenCalledWith(101);
    expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
  });

  it("does not overwrite focus already moved to a new page", () => {
    let callback: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((next) => {
      callback = next;
      return 102;
    });
    let restore = () => {};
    function Harness({ open }: { open: boolean }) {
      restore = useDialogReturnFocus(open);
      return (
        <>
          <button>Trigger</button>
          <h1 tabIndex={-1}>New page</h1>
        </>
      );
    }
    const { rerender } = render(<Harness open={false} />);
    screen.getByRole("button").focus();
    rerender(<Harness open />);
    rerender(<Harness open={false} />);
    restore();
    const heading = screen.getByRole("heading");
    heading.focus();
    act(() => callback?.(0));
    expect(heading).toHaveFocus();
  });

  it("skips initial focus in StrictMode and focuses the next heading after modal cleanup", async () => {
    render(
      <StrictMode>
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <main id="main">
                  <h1>First</h1>
                  <Link to="/next">Next</Link>
                </main>
              }
            />
            <Route
              path="/next"
              element={
                <main id="main">
                  <h1>Next page</h1>
                </main>
              }
            />
          </Routes>
          <RouteAnnouncer />
        </MemoryRouter>
      </StrictMode>,
    );
    expect(screen.getByRole("heading")).not.toHaveFocus();
    const closing = document.createElement("div");
    closing.setAttribute("role", "dialog");
    closing.setAttribute("aria-modal", "true");
    document.body.append(closing);
    try {
      await userEvent.click(screen.getByRole("link", { name: "Next" }));
      const heading = screen.getByRole("heading", { name: "Next page" });
      expect(heading).not.toHaveFocus();
      act(() => closing.remove());
      await waitFor(() => expect(heading).toHaveFocus());
      expect(heading).toHaveAttribute("tabindex", "-1");
      await screen.findByText("Next page. Page loaded.");
    } finally {
      closing.remove();
    }
  });
});
