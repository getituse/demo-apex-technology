import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { describe, expect, it } from "vitest";

import { MotionProvider } from "@/lib/motion";
import { RouteTransition } from "@/lib/motion/RouteTransition";
import { RouteAnnouncer } from "@/hooks/use-route-announcement";

describe("route transition", () => {
  it("focuses the committed heading after a forward transition and Back", async () => {
    function BackButton() {
      const navigate = useNavigate();
      return <button onClick={() => navigate(-1)}>Back</button>;
    }
    render(
      <MotionProvider>
        <MemoryRouter>
          <Routes>
            <Route
              element={
                <>
                  <main id="main">
                    <RouteTransition />
                  </main>
                  <RouteAnnouncer />
                </>
              }
            >
              <Route
                path="/"
                element={
                  <>
                    <h1>Home</h1>
                    <Link to="/about">Go</Link>
                  </>
                }
              />
              <Route
                path="/about"
                element={
                  <>
                    <h1>About</h1>
                    <BackButton />
                  </>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </MotionProvider>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Go" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "About" })).toHaveFocus());
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Home" })).toHaveFocus());
  });

  it("renders initial content immediately and removes the old interactive route on navigation", async () => {
    const { container } = render(
      <MotionProvider>
        <MemoryRouter>
          <Routes>
            <Route element={<RouteTransition />}>
              <Route
                path="/"
                element={
                  <>
                    <h1>First</h1>
                    <Link to="/next">Next</Link>
                  </>
                }
              />
              <Route
                path="/next"
                element={
                  <>
                    <h1>Second</h1>
                    <Link to="/">Return</Link>
                  </>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </MotionProvider>,
    );
    const initial = container.querySelector<HTMLElement>("[data-route-path]");
    expect(initial?.style.opacity).not.toBe("0");
    await userEvent.click(screen.getByRole("link", { name: "Next" }));
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "First" })).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-route-path]")).toHaveLength(1);
    await waitFor(() =>
      expect(container.querySelector<HTMLElement>("[data-route-path]")?.style.opacity).toBe("1"),
    );
    await userEvent.click(screen.getByRole("link", { name: "Return" }));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();
  });
});
