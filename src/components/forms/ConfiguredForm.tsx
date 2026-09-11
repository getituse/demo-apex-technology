import { forwardRef, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import {
  consentRequired,
  formEndpointSchema,
  formFields,
  validateFormValues,
  type FormEndpointConfig,
  type FormFieldId,
  type FormId,
} from "@/config/form-config";
import type { TenantConfig } from "@/config/tenant-schema";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, type InputProps } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const DEMO_NOTICE = "Demonstration only. Nothing was submitted to a server.";
const REQUEST_TIMEOUT_MS = 30_000;
const linkClasses =
  "inline-flex min-h-11 items-center rounded text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

// Input already owns the FormField accessibility wiring; no separate UI checkbox exists.
const Checkbox = forwardRef<HTMLInputElement, InputProps>(function Checkbox(props, ref) {
  return (
    <Input
      {...props}
      ref={ref}
      type="checkbox"
      className="h-6 min-h-6 w-6 cursor-pointer accent-primary"
    />
  );
});

type ControlName = FormFieldId | "consent";
type Control = HTMLInputElement | HTMLTextAreaElement;
type Status = "idle" | "loading" | "success" | "error" | "demo" | "blocked";
interface FieldError {
  field: ControlName;
  label: string;
  message: string;
  targetId: string;
}

export interface ConfiguredFormProps {
  formId: FormId;
  label?: string;
}

export function ConfiguredForm({ formId, label }: ConfiguredFormProps) {
  const { config } = useTenant();
  const settings = useMemo(
    () => formEndpointSchema.parse(config.integrations.forms[formId]),
    [config, formId],
  );
  if (!settings.enabled || (formId === "newsletter" && !config.features.newsletterSignup)) {
    return null;
  }

  // A changed configuration owns a new form session: clear entered values, abort the
  // old request and never display an acknowledgement belonging to another endpoint.
  // Only authored configuration is serialized here, never entered form values.
  return (
    <FormSession
      key={JSON.stringify([config, formId, label])}
      config={config}
      settings={settings}
      formId={formId}
      label={label}
    />
  );
}

function FormSession({
  config,
  settings,
  formId,
  label,
}: ConfiguredFormProps & { config: TenantConfig; settings: FormEndpointConfig }) {
  const baseId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const controls = useRef<Partial<Record<ControlName, Control>>>({});
  const alive = useRef(false);
  const locked = useRef(false);
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [invalidAttempt, setInvalidAttempt] = useState(0);
  const [resetAttempt, setResetAttempt] = useState(0);
  const fields = formFields(formId, settings);
  const needsConsent = consentRequired(settings);
  const fieldLabels: Record<ControlName, string> = {
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    program: config.terminology.programSingular,
    organisation: "Organisation",
    consent: "Consent",
  };
  const defaultTitles: Record<FormId, string> = {
    generalEnquiry: "General enquiry",
    conversionEnquiry: config.terminology.primaryConversionLabel,
    newsletter: "Newsletter signup",
    consultation: "Consultation request",
  };
  const title = label?.trim() || settings.title || defaultTitles[formId];
  const busy = status === "loading";
  const disabled = !hydrated || busy || status === "success";
  const fallbacks = [
    { id: "email", label: config.contact.email, href: `mailto:${config.contact.email}` },
    {
      id: "phone",
      label: config.contact.phone,
      href: `tel:${config.contact.phone.replace(/[^+\d]/g, "")}`,
    },
    ...(config.contact.whatsapp
      ? [
          {
            id: "whatsapp",
            label: "WhatsApp",
            href: `https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}`,
          },
        ]
      : []),
    ...(settings.externalFormUrl
      ? [{ id: "external", label: "Open external form", href: settings.externalFormUrl }]
      : []),
  ];

  useEffect(() => {
    alive.current = true;
    setHydrated(true);
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      const pending = request.current;
      request.current = null;
      pending?.abort();
    };
  }, []);

  useEffect(() => {
    if (invalidAttempt > 0) summaryRef.current?.focus();
  }, [invalidAttempt]);

  const firstField = fields[0];
  useEffect(() => {
    if (resetAttempt > 0 && firstField) controls.current[firstField]?.focus();
  }, [resetAttempt, firstField]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The ref closes the same-tick gap before React disables the native fieldset.
    if (!hydrated || !alive.current || locked.current) return;
    locked.current = true;
    const data = new FormData(event.currentTarget);
    setErrors([]);
    if (data.get("website")) {
      locked.current = false;
      setStatus("blocked");
      return;
    }

    const result = validateFormValues(formId, settings, {
      ...Object.fromEntries(data),
      consent: data.get("consent") === "true",
    });
    if (!result.success) {
      const nextErrors: FieldError[] = [];
      for (const issue of result.error.issues) {
        const field = [...fields, "consent" as const].find((name) => name === issue.path[0]);
        if (!field || nextErrors.some((error) => error.field === field)) continue;
        nextErrors.push({
          field,
          label: fieldLabels[field],
          message: issue.message,
          targetId: controls.current[field]?.id ?? "",
        });
      }
      setErrors(nextErrors);
      setStatus("idle");
      setInvalidAttempt((attempt) => attempt + 1);
      locked.current = false;
      return;
    }
    if (!settings.endpoint) {
      setStatus("demo");
      locked.current = false;
      return;
    }

    const body = new URLSearchParams();
    for (const field of fields) body.set(field, String(result.data[field]));
    if (needsConsent) body.set("consent", "true");
    const url = new URL(settings.endpoint);
    if (settings.method === "GET") {
      // Preserve unrelated endpoint query values, replacing collisions with validated
      // data under their configured field keys, not their presentation labels.
      for (const [name, value] of body) url.searchParams.set(name, value);
    }

    const controller = new AbortController();
    request.current = controller;
    const isCurrent = () => alive.current && request.current === controller;
    setStatus("loading");
    timer.current = setTimeout(() => {
      if (!isCurrent()) return;
      request.current = null;
      controller.abort();
      locked.current = false;
      setStatus("error");
    }, REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url.href, {
        method: settings.method,
        ...(settings.method === "POST"
          ? {
              body,
              headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            }
          : {}),
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        cache: "no-store",
      });
      if (!isCurrent()) return;
      const acknowledged =
        response.ok &&
        response.status >= 200 &&
        response.status < 300 &&
        !["opaque", "opaqueredirect", "error"].includes(response.type) &&
        !response.redirected;
      setStatus(acknowledged ? "success" : "error");
      locked.current = acknowledged;
    } catch {
      if (!isCurrent()) return;
      setStatus("error");
      locked.current = false;
    } finally {
      if (isCurrent()) {
        clearTimeout(timer.current);
        request.current = null;
      }
    }
  }

  function reset() {
    if (status !== "success" && !(status === "demo" && !config.legal.demoContentNotice)) return;
    formRef.current?.reset();
    locked.current = false;
    setErrors([]);
    setStatus("idle");
    setResetAttempt((attempt) => attempt + 1);
  }

  return (
    <form
      ref={formRef}
      aria-labelledby={`${baseId}-title`}
      aria-describedby={`${baseId}-notice${settings.endpoint && settings.method === "GET" ? ` ${baseId}-get-warning` : ""}`}
      aria-busy={busy}
      method="post"
      noValidate
      onSubmit={submit}
      className="space-y-6 rounded-lg border border-border bg-surface p-5 text-foreground sm:p-8"
    >
      <p id={`${baseId}-title`} className="font-heading text-xl font-semibold">
        {title}
      </p>
      <div id={`${baseId}-notice`} className="space-y-2 text-sm text-muted-foreground">
        {config.legal.demoContentNotice ? <p>{config.legal.demoContentNotice}</p> : null}
        {!settings.endpoint && config.legal.demoContentNotice ? <p>{DEMO_NOTICE}</p> : null}
      </div>
      {settings.endpoint && settings.method === "GET" ? (
        <p id={`${baseId}-get-warning`} className="text-sm text-muted-foreground">
          This form uses GET. Your entries will be included in the request URL and may appear in
          service or proxy logs. Avoid sensitive information.
        </p>
      ) : null}
      <noscript>
        <p>
          JavaScript is required to validate and send this form. Nothing was submitted. Use the
          contact options below instead.
        </p>
      </noscript>
      {errors.length > 0 ? (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby={`${baseId}-errors`}
          className="rounded border border-destructive p-4 focus:outline-none focus:ring-[3px] focus:ring-ring"
        >
          <p id={`${baseId}-errors`} className="font-semibold">
            Please correct the following fields
          </p>
          <ul className="mt-2 list-disc ps-5">
            {errors.map((error) => (
              <li key={error.field}>
                <a
                  href={`#${error.targetId}`}
                  className={`${linkClasses} max-w-full [overflow-wrap:anywhere]`}
                  onClick={(event) => {
                    event.preventDefault();
                    controls.current[error.field]?.focus();
                  }}
                >
                  {error.label}: {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {/* Disabled in server HTML, before hydration and while submitting. No controls
          live in a legend, where the native disabled-fieldset rule has an exception. */}
      <fieldset disabled={disabled} className="min-w-0 space-y-5">
        <legend className="sr-only">{title} details</legend>
        {fields.map((field) => {
          const error = errors.find((entry) => entry.field === field);
          return (
            <FormField
              key={field}
              label={fieldLabels[field]}
              required={settings.requiredFields.includes(field)}
              error={error ? `Error: ${error.message}` : undefined}
            >
              {field === "message" ? (
                <Textarea
                  name={field}
                  ref={(element) => {
                    if (element) controls.current[field] = element;
                  }}
                />
              ) : (
                <Input
                  name={field}
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  autoComplete={
                    field === "program"
                      ? "off"
                      : field === "organisation"
                        ? "organization"
                        : field === "phone"
                          ? "tel"
                          : field
                  }
                  ref={(element) => {
                    if (element) controls.current[field] = element;
                  }}
                />
              )}
            </FormField>
          );
        })}
        {needsConsent ? (
          <FormField
            label={settings.consentText!}
            required
            error={errors.find((error) => error.field === "consent")?.message}
          >
            <Checkbox
              name="consent"
              value="true"
              ref={(element) => {
                if (element) controls.current.consent = element;
              }}
            />
          </FormField>
        ) : null}
        <div hidden aria-hidden="true">
          <FormField label="Leave this field empty">
            <Input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </FormField>
        </div>
        <Button type="submit" disabled={disabled}>
          {busy
            ? "Sending…"
            : settings.submitLabel ||
              (settings.endpoint || !config.legal.demoContentNotice
                ? "Send request"
                : "Validate demonstration")}
        </Button>
      </fieldset>
      <div role="status" aria-live="polite" aria-atomic="true">
        {busy ? "Sending your request…" : null}
        {status === "success" || (status === "demo" && !config.legal.demoContentNotice)
          ? settings.successMessage
          : null}
        {status === "demo" && config.legal.demoContentNotice ? DEMO_NOTICE : null}
      </div>
      {status === "error" || status === "blocked" ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{status === "blocked" ? "Unable to submit this request." : settings.errorMessage}</p>
          {status === "error" ? (
            <p>Delivery could not be confirmed. Check with the recipient before sending again.</p>
          ) : null}
        </div>
      ) : null}
      {status === "success" || (status === "demo" && !config.legal.demoContentNotice) ? (
        <Button onClick={reset}>Start another request</Button>
      ) : null}
      <div className="space-y-2">
        <p className="font-medium">Other contact options</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {fallbacks.map((action) => (
            <li key={action.id} className="min-w-0 max-w-full">
              <a
                href={action.href}
                className={`${linkClasses} max-w-full [overflow-wrap:anywhere]`}
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
              >
                {action.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
