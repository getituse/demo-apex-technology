import { z } from "zod";

export const FORM_IDS = [
  "generalEnquiry",
  "conversionEnquiry",
  "newsletter",
  "consultation",
] as const;
export type FormId = (typeof FORM_IDS)[number];

export const FORM_FIELDS = [
  "name",
  "email",
  "phone",
  "message",
  "program",
  "organisation",
] as const;
export type FormFieldId = (typeof FORM_FIELDS)[number];

const nonEmptyText = z.string().trim().min(1);

function hasUnsafeUrlCharacters(value: string): boolean {
  return (
    value.includes("\\") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || (code >= 127 && code <= 159);
    })
  );
}

const safeHttpsUrl = z
  .string()
  .url()
  .refine((value) => {
    // Check before URL parsing, which silently normalizes tabs, newlines and slashes.
    const authority = /^https:\/\/([^/?#]+)(?:[/?]|$)/i.exec(value)?.[1];
    if (!authority || authority.includes("@") || /\s/.test(value) || value.includes("#")) {
      return false;
    }
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname.length > 0 &&
        !url.username &&
        !url.password &&
        !hasUnsafeUrlCharacters(value) &&
        !hasUnsafeUrlCharacters(decodeURIComponent(value))
      );
    } catch {
      return false;
    }
  }, "must be an absolute HTTPS URL without credentials, fragments, controls or backslashes");

/** An enabled form without an endpoint is valid: the UI must use honest demo mode. */
export const formEndpointSchema = z
  .object({
    enabled: z.boolean(),
    endpoint: safeHttpsUrl.optional(),
    method: z.enum(["GET", "POST"]),
    successMessage: nonEmptyText,
    errorMessage: nonEmptyText,
    requiredFields: z
      .array(z.enum(FORM_FIELDS))
      .min(1)
      .refine((fields) => new Set(fields).size === fields.length, "must contain unique fields"),
    consentText: nonEmptyText.optional(),
    consentEnabled: z.boolean().optional(),
    title: nonEmptyText.optional(),
    submitLabel: nonEmptyText.optional(),
    externalFormUrl: safeHttpsUrl.optional(),
  })
  .strict()
  .superRefine((settings, context) => {
    if (settings.endpoint) {
      const reserved = new Set<string>([...FORM_FIELDS, "consent", "website"]);
      let keys: string[] = [];
      try {
        keys = [...new URL(settings.endpoint).searchParams.keys()];
      } catch {
        /* URL schema reports malformed input. */
      }
      for (const key of keys) {
        if (reserved.has(key.toLowerCase()))
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endpoint"],
            message: "endpoint query must not prefill form fields, consent or the honeypot",
          });
      }
    }
    if (settings.consentEnabled === true && !settings.consentText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["consentText"],
        message: "consentText is required when consent is enabled",
      });
    }
  });
export type FormEndpointConfig = z.infer<typeof formEndpointSchema>;

/** Legacy text-only settings enable consent; an explicit false always opts out. */
export function consentRequired(settings: FormEndpointConfig): boolean {
  return settings.consentEnabled ?? Boolean(settings.consentText?.trim());
}

/** Base fields first, then configured additions in authored order, without duplicates. */
export function formFields(formId: FormId, settings: FormEndpointConfig): FormFieldId[] {
  const base: FormFieldId[] =
    formId === "newsletter" ? ["email"] : ["name", "email", "phone", "message"];
  return [...new Set([...base, ...settings.requiredFields])];
}

const textLimits = {
  name: 120,
  email: 254,
  phone: 25,
  message: 4000,
  program: 120,
  organisation: 160,
} as const satisfies Record<FormFieldId, number>;

const emailValue = z.string().email();
const phoneValue = z.string().refine((value) => {
  // International/local display punctuation is allowed; extensions are not inferred.
  const digits = value.replace(/[^0-9]/g, "");
  return /^\+?[0-9 ().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
}, "must be a phone number containing 7 to 15 digits");

function fieldValue(field: FormFieldId, required: boolean) {
  const text = z
    .string()
    .trim()
    .max(textLimits[field])
    .superRefine((value, context) => {
      if (!value) {
        if (required) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: "This field is required" });
        }
        return;
      }
      const format = field === "email" ? emailValue : field === "phone" ? phoneValue : undefined;
      if (format) {
        const result = format.safeParse(value);
        if (!result.success) {
          for (const issue of result.error.issues) context.addIssue(issue);
        }
      }
    });
  // Missing optional controls become empty strings, but null/objects are never coerced.
  return z.preprocess((value) => (value === undefined ? "" : value), text);
}

/** Validate rendered controls only. Text stays plaintext; the UI owns safe rendering. */
export function validateFormValues(
  formId: FormId,
  settings: FormEndpointConfig,
  values: Record<string, unknown>,
) {
  const shape: Record<string, z.ZodType<string | boolean, z.ZodTypeDef, unknown>> = {};
  for (const field of formFields(formId, settings)) {
    shape[field] = fieldValue(field, settings.requiredFields.includes(field));
  }
  return z
    .object(shape)
    .extend({
      consent: z.preprocess(
        (value) => (value === undefined ? false : value),
        z.boolean().refine((value) => !consentRequired(settings) || value, "Consent is required"),
      ),
      // A populated honeypot is not rejected here: the UI handles bot submissions.
      website: z.preprocess((value) => (value === undefined ? "" : value), z.string().max(200)),
    })
    .safeParse(values);
}
