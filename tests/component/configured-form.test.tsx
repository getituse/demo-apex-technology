import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConfiguredForm } from "@/components/forms/ConfiguredForm";
import {
  FORM_IDS,
  formEndpointSchema,
  type FormEndpointConfig,
  type FormId,
} from "@/config/form-config";
import type { TenantConfig } from "@/config/tenant-schema";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { config as baseConfig, content } from "@/site";

const DEMO = "Demonstration only. Nothing was submitted to a server.";
const SUCCESS = "Your configured acknowledgement.";
const FAILURE = "The configured service could not confirm delivery.";
const NOTICE = "Fictional demonstration contacts; do not send personal information.";
const ENDPOINT = "https://forms.example.org/collect?source=website";
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockRejectedValue(new Error("Unexpected request"));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function fixture(formId: FormId = "generalEnquiry", overrides: Partial<FormEndpointConfig> = {}) {
  const config = structuredClone(baseConfig);
  config.features.newsletterSignup = true;
  config.legal.demoContentNotice = NOTICE;
  config.contact.email = "hello@example.org";
  config.contact.phone = "+44 (20) 1234 5678";
  config.contact.whatsapp = "+44 7700 900123";
  config.terminology.programSingular = "Selected service";
  config.terminology.primaryConversionLabel = "Get started";
  config.integrations.forms[formId] = formEndpointSchema.parse({
    enabled: true,
    method: "POST",
    successMessage: SUCCESS,
    errorMessage: FAILURE,
    requiredFields: formId === "newsletter" ? ["email"] : ["name", "email", "message"],
    consentEnabled: false,
    externalFormUrl: "https://forms.example.org/external",
    ...overrides,
  });
  return config;
}

function view(config: TenantConfig, formId: FormId = "generalEnquiry", label?: string) {
  return (
    <TenantProvider config={config} content={content}>
      <ConfiguredForm formId={formId} label={label} />
    </TenantProvider>
  );
}

function form() {
  return screen.getByRole<HTMLFormElement>("form");
}

function control(name: string) {
  const element = form().querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  if (!element) throw new Error(`Missing control ${name}`);
  return element;
}

function fill(name: string, value: string) {
  fireEvent.change(control(name), { target: { value } });
}

function fillValid() {
  const values = {
    name: "  Alex Example  ",
    email: "  alex@example.org  ",
    phone: "+44 (20) 1234 5678",
    message: "  A sample request & question.  ",
    program: "  Design & planning  ",
    organisation: "  Example team  ",
  };
  for (const [name, value] of Object.entries(values)) {
    if (form().querySelector(`[name="${name}"]`)) fill(name, value);
  }
  const checkbox = screen.queryByRole("checkbox");
  if (checkbox) fireEvent.click(checkbox);
}

function submit() {
  fireEvent.submit(form());
}

function pendingRequest() {
  let resolve!: (response: Response) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  fetchMock.mockReturnValueOnce(promise);
  return { resolve, reject };
}

async function resolveRequest(pending: ReturnType<typeof pendingRequest>, response: Response) {
  await act(async () => pending.resolve(response));
}

function assertFallbacks() {
  expect(screen.getByRole("link", { name: "hello@example.org" })).toHaveAttribute(
    "href",
    "mailto:hello@example.org",
  );
  expect(screen.getByRole("link", { name: "+44 (20) 1234 5678" })).toHaveAttribute(
    "href",
    "tel:+442012345678",
  );
  expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/447700900123",
  );
  const external = screen.getByRole("link", { name: "Open external form" });
  expect(external).toHaveAttribute("href", "https://forms.example.org/external");
  expect(external).toHaveAttribute("rel", "noopener noreferrer");
  expect(external).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(screen.getByText(NOTICE)).toBeVisible();
}

describe("configured forms", () => {
  it.each(FORM_IDS)("validates %s in honest demo mode with visible fallback contacts", (formId) => {
    render(view(fixture(formId), formId));
    expect(form()).toHaveAccessibleName();
    expect(screen.getByText(DEMO)).toBeVisible();
    expect(screen.queryByText(SUCCESS)).not.toBeInTheDocument();
    assertFallbacks();
    if (formId === "newsletter") {
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
    }
    fillValid();
    submit();
    expect(screen.getByRole("status")).toHaveTextContent(DEMO);
    expect(screen.getAllByText(DEMO)).toHaveLength(2);
    expect(screen.queryByText(SUCCESS)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start another request" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    assertFallbacks();
  });

  it.each(FORM_IDS)("returns null for disabled %s", (formId) => {
    const { container } = render(view(fixture(formId, { enabled: false }), formId));
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("also requires the newsletter feature flag", () => {
    const config = fixture("newsletter");
    config.features.newsletterSignup = false;
    const { container } = render(view(config, "newsletter"));
    expect(container).toBeEmptyDOMElement();
  });

  it("names the form from label, configured title, then neutral/configured defaults", () => {
    const config = fixture("conversionEnquiry", {
      title: "Configured request",
      submitLabel: "Check details",
      requiredFields: ["program", "organisation"],
    });
    const { rerender } = render(view(config, "conversionEnquiry", "Custom label"));
    expect(form()).toHaveAccessibleName("Custom label");
    expect(screen.getByRole("button", { name: "Check details" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: /Selected service/ })).toHaveAttribute(
      "name",
      "program",
    );
    rerender(view(config, "conversionEnquiry"));
    expect(form()).toHaveAccessibleName("Configured request");
    rerender(view(fixture("conversionEnquiry"), "conversionEnquiry"));
    expect(form()).toHaveAccessibleName("Get started");
  });

  it("omits unconfigured optional fallback channels", () => {
    const config = fixture("generalEnquiry", { externalFormUrl: undefined });
    delete config.contact.whatsapp;
    render(view(config));
    expect(screen.queryByRole("link", { name: "WhatsApp" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open external form" })).toBeNull();
  });

  it("focuses an error summary on every invalid submit and links to wired inline errors", () => {
    render(view(fixture()));
    fill("name", "   ");
    submit();
    const summary = screen.getByRole("alert", { name: "Please correct the following fields" });
    expect(summary).toHaveFocus();
    const links = within(summary).getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) {
      const targetId = link.getAttribute("href")!.slice(1);
      const input = document.getElementById(targetId)!;
      expect(input).toHaveAttribute("aria-invalid", "true");
      const error = document.getElementById(input.getAttribute("aria-describedby")!);
      expect(error).toHaveTextContent("Error: This field is required");
      fireEvent.click(link);
      expect(input).toHaveFocus();
    }
    submit();
    expect(summary).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
    fillValid();
    submit();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(control("name")).not.toHaveAttribute("aria-invalid");
  });

  it.each([
    ["email", "not-an-email"],
    ["phone", "letters instead"],
    ["phone", "123"],
    ["name", "x".repeat(121)],
    ["email", `${"a".repeat(245)}@example.org`],
    ["phone", "1".repeat(26)],
    ["message", "x".repeat(4001)],
    ["program", "x".repeat(121)],
    ["organisation", "x".repeat(161)],
  ])("validates format and bounds for %s", (name, value) => {
    render(
      view(
        fixture("generalEnquiry", {
          endpoint: ENDPOINT,
          requiredFields: ["name", "email", "program", "organisation"],
        }),
      ),
    );
    fillValid();
    fill(name, value);
    submit();
    expect(control(name)).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("alert", { name: "Please correct the following fields" }),
    ).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts blank optional fields but still validates nonblank optional values", () => {
    render(view(fixture("generalEnquiry", { requiredFields: ["email"] })));
    fill("email", "valid@example.org");
    fill("phone", "   ");
    submit();
    expect(screen.getByRole("status")).toHaveTextContent(DEMO);
    fill("phone", "bad value");
    submit();
    expect(control("phone")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each([true, undefined])(
    "requires consent when enabled or provided by legacy text (%s)",
    (consentEnabled) => {
      render(
        view(
          fixture("generalEnquiry", {
            consentEnabled,
            consentText: "I agree to the configured privacy notice.",
          }),
        ),
      );
      fillValid();
      const checkbox = screen.getByRole("checkbox", { name: /I agree/ });
      fireEvent.click(checkbox);
      submit();
      expect(checkbox).toHaveAttribute("aria-invalid", "true");
      expect(checkbox).toHaveAccessibleDescription("Consent is required");
      fireEvent.click(screen.getByRole("link", { name: "Consent: Consent is required" }));
      expect(checkbox).toHaveFocus();
      fireEvent.click(checkbox);
      submit();
      expect(screen.getByRole("status")).toHaveTextContent(DEMO);
    },
  );

  it("explicitly disabled consent overrides legacy text", () => {
    render(view(fixture("generalEnquiry", { consentEnabled: false, consentText: "Legacy text" })));
    expect(screen.queryByRole("checkbox")).toBeNull();
    fillValid();
    submit();
    expect(screen.getByRole("status")).toHaveTextContent(DEMO);
  });

  it.each([undefined, ENDPOINT])(
    "blocks the hidden honeypot without success or a request (%s)",
    (endpoint) => {
      render(view(fixture("generalEnquiry", { endpoint })));
      fillValid();
      const trap = control("website");
      expect(trap).toHaveAttribute("tabindex", "-1");
      expect(trap.closest("[aria-hidden=true]")).toHaveAttribute("hidden");
      expect(trap).not.toBeVisible();
      expect(screen.queryByRole("textbox", { name: "Leave this field empty" })).toBeNull();
      fill("website", " ");
      submit();
      expect(screen.getByRole("alert")).toHaveTextContent("Unable to submit this request.");
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(screen.queryByText(SUCCESS)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("locks duplicate submissions synchronously, disables pending controls and requires explicit reset after success", async () => {
    const pending = pendingRequest();
    render(
      view(
        fixture("generalEnquiry", {
          endpoint: ENDPOINT,
          consentText: "I agree",
          consentEnabled: true,
        }),
      ),
    );
    fillValid();
    act(() => {
      form().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form().dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(form()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Sending your request…");
    for (const input of form().querySelectorAll("input,textarea,button"))
      expect(input).toBeDisabled();
    assertFallbacks();
    await resolveRequest(pending, new Response(null, { status: 201 }));
    expect(screen.getByRole("status")).toHaveTextContent(SUCCESS);
    expect(form()).toHaveAttribute("aria-busy", "false");
    expect(control("email")).toBeDisabled();
    submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Start another request" }));
    expect(control("email")).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(control("email")).toBeEnabled();
    expect(control("name")).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    submit();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fillValid();
    const next = pendingRequest();
    submit();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await resolveRequest(next, new Response(null, { status: 204 }));
    expect(screen.getByRole("status")).toHaveTextContent(SUCCESS);
  });

  it.each([200, 201, 202, 204, 299])(
    "accepts only acknowledged 2xx outcomes (%s)",
    async (status) => {
      const pending = pendingRequest();
      render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
      fillValid();
      submit();
      await resolveRequest(pending, new Response(null, { status }));
      expect(screen.getByRole("status")).toHaveTextContent(SUCCESS);
      expect(control("email")).toBeDisabled();
    },
  );

  it.each([300, 400, 429, 500])("does not acknowledge HTTP %s or retry it", async (status) => {
    const pending = pendingRequest();
    render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
    fillValid();
    submit();
    await resolveRequest(pending, new Response("Untrusted response text", { status }));
    expect(screen.getByRole("alert")).toHaveTextContent(FAILURE);
    expect(screen.queryByText("Untrusted response text")).toBeNull();
    expect(screen.queryByText(SUCCESS)).toBeNull();
    expect(control("email")).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    assertFallbacks();
  });

  it.each(["opaque", "opaqueredirect", "error"])(
    "rejects a %s response even with a claimed 200",
    async (type) => {
      const pending = pendingRequest();
      render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
      fillValid();
      submit();
      const response = new Response(null, { status: 200 });
      Object.defineProperty(response, "type", { value: type });
      await resolveRequest(pending, response);
      expect(screen.getByRole("alert")).toHaveTextContent(FAILURE);
      expect(screen.queryByText(SUCCESS)).toBeNull();
    },
  );

  it.each(["zero status", "redirected"])("rejects non-acknowledgements: %s", async (kind) => {
    const pending = pendingRequest();
    render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
    fillValid();
    submit();
    const response = new Response(null, { status: 200 });
    Object.defineProperty(response, kind === "zero status" ? "status" : "redirected", {
      value: kind === "zero status" ? 0 : true,
    });
    await resolveRequest(pending, response);
    expect(screen.getByRole("alert")).toHaveTextContent(FAILURE);
  });

  it("handles rejected fetch without reflecting exception details or retrying", async () => {
    const pending = pendingRequest();
    render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
    fillValid();
    submit();
    await act(async () => pending.reject(new Error("Private endpoint exception")));
    expect(screen.getByRole("alert")).toHaveTextContent(FAILURE);
    expect(screen.queryByText("Private endpoint exception")).toBeNull();
    expect(control("email")).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["POST", "GET"] as const)(
    "encodes trimmed %s values under data keys with explicit privacy options",
    async (method) => {
      const pending = pendingRequest();
      render(
        view(
          fixture("conversionEnquiry", {
            endpoint: `${ENDPOINT}&tag=one&tag=two`,
            method,
            requiredFields: ["email", "program", "organisation"],
            consentEnabled: true,
            consentText: "I agree",
          }),
          "conversionEnquiry",
        ),
      );
      fillValid();
      fill("name", "  Zoë + Example & team  ");
      fill("message", "  A&B=1 + café\nsecond line  ");
      submit();
      const [input, init] = fetchMock.mock.calls[0]!;
      expect(typeof input).toBe("string");
      const url = new URL(String(input));
      expect(url.searchParams.getAll("tag")).toEqual(["one", "two"]);
      expect(url.searchParams.get("source")).toBe("website");
      expect(init).toMatchObject({
        method,
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        cache: "no-store",
      });
      expect(init?.signal?.aborted).toBe(false);
      const values = method === "GET" ? url.searchParams : (init!.body as URLSearchParams);
      expect(values).toBeInstanceOf(URLSearchParams);
      expect(values.get("name")).toBe("Zoë + Example & team");
      expect(values.get("email")).toBe("alex@example.org");
      expect(values.get("message")).toBe("A&B=1 + café\nsecond line");
      expect(values.get("program")).toBe("Design & planning");
      expect(values.get("organisation")).toBe("Example team");
      expect(values.get("consent")).toBe("true");
      expect(values.has("website")).toBe(false);
      expect(values.has("Selected service")).toBe(false);
      expect(values.toString()).toContain("%26");
      expect(values.toString()).toContain("%2B");
      if (method === "GET") {
        expect(values.getAll("email")).toEqual(["alex@example.org"]);
        expect(init).not.toHaveProperty("body");
        expect(init).not.toHaveProperty("headers");
        expect(screen.getByText(/entries will be included in the request URL/)).toBeVisible();
        expect(form()).toHaveAccessibleDescription(/request URL/);
      } else {
        expect(init?.headers).toEqual({
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        });
        expect(url.searchParams.has("program")).toBe(false);
        expect(screen.queryByText(/entries will be included in the request URL/)).toBeNull();
      }
      await resolveRequest(pending, new Response(null, { status: 204 }));
    },
  );

  it("sends blank optional values but not an absent consent control", async () => {
    const pending = pendingRequest();
    render(view(fixture("generalEnquiry", { endpoint: ENDPOINT, requiredFields: ["email"] })));
    fill("email", "valid@example.org");
    submit();
    const body = fetchMock.mock.calls[0]![1]!.body as URLSearchParams;
    expect(Object.fromEntries(body)).toEqual({
      name: "",
      email: "valid@example.org",
      phone: "",
      message: "",
    });
    await resolveRequest(pending, new Response(null, { status: 204 }));
  });

  it("renders configured success/error strings as escaped text and never reads response text", async () => {
    const text = '<img src="x" onerror="alert(1)">';
    const pending = pendingRequest();
    const config = fixture("generalEnquiry", {
      endpoint: ENDPOINT,
      successMessage: text,
      errorMessage: text,
    });
    const { container } = render(view(config));
    fillValid();
    submit();
    const response = new Response("Private response body", { status: 200 });
    const read = vi.spyOn(response, "text");
    await resolveRequest(pending, response);
    expect(screen.getByRole("status")).toHaveTextContent(text);
    expect(container.querySelector("img,script")).toBeNull();
    expect(screen.queryByText("Private response body")).toBeNull();
    expect(read).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Start another request" }));
    fillValid();
    const failed = pendingRequest();
    submit();
    await resolveRequest(failed, new Response(null, { status: 500 }));
    expect(screen.getByRole("alert")).toHaveTextContent(text);
    expect(container.querySelector("img,script")).toBeNull();
  });

  it("times out at 30 seconds, aborts without retrying and ignores a late acknowledgement", async () => {
    vi.useFakeTimers();
    const pending = pendingRequest();
    render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
    fillValid();
    submit();
    const signal = fetchMock.mock.calls[0]![1]!.signal!;
    act(() => vi.advanceTimersByTime(29_999));
    expect(control("email")).toBeDisabled();
    expect(signal.aborted).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(signal.aborted).toBe(true);
    expect(screen.getByRole("alert")).toHaveTextContent(FAILURE);
    expect(control("email")).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const next = pendingRequest();
    submit();
    await resolveRequest(pending, new Response(null, { status: 200 }));
    expect(screen.getByRole("status")).toHaveTextContent("Sending your request…");
    expect(control("email")).toBeDisabled();
    await resolveRequest(next, new Response(null, { status: 204 }));
    expect(screen.getByRole("status")).toHaveTextContent(SUCCESS);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("aborts and clears its deadline on unmount without late status updates", async () => {
    vi.useFakeTimers();
    const pending = pendingRequest();
    const { unmount, container } = render(view(fixture("generalEnquiry", { endpoint: ENDPOINT })));
    fillValid();
    submit();
    const signal = fetchMock.mock.calls[0]![1]!.signal!;
    unmount();
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await resolveRequest(pending, new Response(null, { status: 200 }));
    expect(container).toBeEmptyDOMElement();
  });

  it.each(["endpoint", "notice", "formId", "disabled", "feature"])(
    "ends the old session on configuration change: %s",
    async (change) => {
      vi.useFakeTimers();
      const pending = pendingRequest();
      const config = fixture("newsletter", { endpoint: ENDPOINT });
      const { rerender } = render(view(config, "newsletter"));
      fillValid();
      submit();
      const signal = fetchMock.mock.calls[0]![1]!.signal!;
      const next = structuredClone(config);
      if (change === "endpoint")
        next.integrations.forms.newsletter.endpoint = "https://new.example.org/form";
      if (change === "notice") next.legal.demoContentNotice = "Revised fictional notice";
      if (change === "disabled") next.integrations.forms.newsletter.enabled = false;
      if (change === "feature") next.features.newsletterSignup = false;
      rerender(view(next, change === "formId" ? "generalEnquiry" : "newsletter"));
      expect(signal.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
      await resolveRequest(pending, new Response(null, { status: 200 }));
      expect(screen.queryByText(SUCCESS)).toBeNull();
      if (change === "disabled" || change === "feature") {
        expect(screen.queryByRole("form")).toBeNull();
      } else {
        expect(control("email")).toHaveValue("");
        expect(control("email")).toBeEnabled();
        expect(screen.getByRole("status")).toBeEmptyDOMElement();
      }
    },
  );

  it.each([undefined, ENDPOINT])(
    "ships a native disabled-fieldset and noscript guard before hydration (%s)",
    (endpoint) => {
      const config = fixture("generalEnquiry", {
        endpoint,
        consentEnabled: true,
        consentText: "I agree",
      });
      const markup = renderToStaticMarkup(view(config));
      const root = document.createElement("div");
      root.innerHTML = markup;
      const staticForm = root.querySelector("form")!;
      expect(staticForm.querySelector("fieldset")).toHaveAttribute("disabled");
      expect(staticForm.querySelector("fieldset legend input,fieldset legend button")).toBeNull();
      expect(staticForm.querySelector("noscript")).toHaveTextContent(/JavaScript is required/);
      expect(staticForm).toHaveAttribute("method", "post");
      expect(Array.from(new FormData(staticForm))).toEqual([]);
      for (const input of staticForm.querySelectorAll("input,textarea,button"))
        expect(input).toBeDisabled();
      expect(staticForm.querySelectorAll("a")).toHaveLength(4);
      expect(fetchMock).not.toHaveBeenCalled();
      render(view(config));
      expect(form().querySelector("fieldset")).not.toHaveAttribute("disabled");
      expect(control("email")).toBeEnabled();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
