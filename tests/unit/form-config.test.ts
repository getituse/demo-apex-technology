// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  FORM_FIELDS,
  FORM_IDS,
  consentRequired,
  formEndpointSchema,
  formFields,
  validateFormValues,
  type FormEndpointConfig,
  type FormFieldId,
  type FormId,
} from "../../src/config/form-config";

function settings(overrides: Partial<FormEndpointConfig> = {}): FormEndpointConfig {
  return {
    enabled: true,
    method: "POST",
    successMessage: "Thank you",
    errorMessage: "Please try again",
    requiredFields: ["email"],
    ...overrides,
  };
}

const validValues: Record<FormFieldId, string> = {
  name: "Zoë O'Connor",
  email: "person@example.com",
  phone: "+44 (20) 7946-0958",
  message: "Please send details.",
  program: "Design & development",
  organisation: "Example organisation",
};

describe("form endpoint configuration", () => {
  it.each([...FORM_FIELDS, "consent", "website", "CONSENT", "%63onsent"])(
    "rejects forged endpoint field %s regardless of method or consent setting",
    (key) => {
      for (const method of ["GET", "POST"] as const) {
        expect(
          formEndpointSchema.safeParse(
            settings({
              method,
              consentEnabled: false,
              endpoint: `https://forms.example.com/submit?${key}=true`,
            }),
          ).success,
        ).toBe(false);
      }
    },
  );
  it("exports the four form IDs and six known fields", () => {
    const ids: readonly FormId[] = FORM_IDS;
    const fields: readonly FormFieldId[] = FORM_FIELDS;
    expect(ids).toEqual(["generalEnquiry", "conversionEnquiry", "newsletter", "consultation"]);
    expect(fields).toEqual(["name", "email", "phone", "message", "program", "organisation"]);
  });

  it.each(FORM_IDS)("accepts endpoint-free demo settings for %s without adding config", (id) => {
    const config = settings();
    expect(formEndpointSchema.parse(config)).toEqual(config);
    expect(validateFormValues(id, config, { email: validValues.email }).success).toBe(true);
    expect(formEndpointSchema.parse(settings({ enabled: false }))).not.toHaveProperty("endpoint");
    expect(formEndpointSchema.parse(settings())).not.toHaveProperty("consentEnabled");
    expect(formEndpointSchema.parse(settings())).not.toHaveProperty("consentText");
  });

  it.each(["GET", "POST"] as const)("accepts %s and optional presentation settings", (method) => {
    const config = settings({
      method,
      endpoint: "https://forms.example.com/submit?source=web&label=A%20B",
      externalFormUrl: "https://forms.example.com/request",
      title: "  Request details  ",
      submitLabel: "  Send  ",
      successMessage: "  Thank you  ",
      errorMessage: "  Please try again  ",
    });
    expect(formEndpointSchema.parse(config)).toEqual({
      ...config,
      title: "Request details",
      submitLabel: "Send",
      successMessage: "Thank you",
      errorMessage: "Please try again",
    });
  });

  const unsafeEndpoints = [
    "",
    "not a URL",
    "/submit",
    "//forms.example.com/submit",
    "http://forms.example.com/submit",
    "javascript:alert(1)",
    "data:text/plain,hello",
    "https:forms.example.com/submit",
    "https:////forms.example.com/submit",
    "https://person:secret@forms.example.com/submit",
    "https://person@forms.example.com/submit",
    "https://@forms.example.com/submit",
    "https://forms.example.com/submit#section",
    "https://forms.example.com/submit#",
    "https://forms.example.com\\submit",
    "https://forms.example.com/submit\n",
    "https://forms.exa\tmple.com/submit",
    `https://forms.example.com/${String.fromCharCode(0)}`,
    `https://forms.example.com/${String.fromCharCode(127)}`,
    `https://forms.example.com/${String.fromCharCode(133)}`,
    " https://forms.example.com/submit",
    "https://forms.example.com/submit ",
    "https://forms.example.com/%0d%0aheader",
    "https://forms.example.com/%5csubmit",
    "https://forms.example.com/%C2%85",
    "https://forms.example.com/%",
  ];

  it.each(unsafeEndpoints)("rejects unsafe endpoint and external form URL %j", (url) => {
    for (const field of ["endpoint", "externalFormUrl"] as const) {
      const result = formEndpointSchema.safeParse({ ...settings(), [field]: url });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.path).toEqual([field]);
    }
  });

  it.each([
    { enabled: undefined },
    { enabled: "true" },
    { method: undefined },
    { method: "PUT" },
    { method: "post" },
    { endpoint: null },
    { externalFormUrl: false },
    { requiredFields: undefined },
    { requiredFields: [] },
    { requiredFields: ["unknown"] },
    { requiredFields: ["Email"] },
    { requiredFields: [" email "] },
    { requiredFields: ["consent"] },
    { requiredFields: ["website"] },
    { requiredFields: ["__proto__"] },
    { requiredFields: ["email", "name", "email"] },
    { requiredFields: "email" },
    { successMessage: undefined },
    { successMessage: " " },
    { errorMessage: undefined },
    { errorMessage: "\t" },
    { title: " " },
    { submitLabel: " " },
    { consentEnabled: "true" },
    { consentEnabled: true },
    { consentEnabled: true, consentText: "  " },
    { consentEnabled: false, consentText: "" },
    { consentText: null },
    { extraSetting: true },
  ])("rejects missing/invalid configuration %j", (overrides) => {
    expect(formEndpointSchema.safeParse({ ...settings(), ...overrides }).success).toBe(false);
  });

  it("accepts every known required field and preserves authored order", () => {
    const requiredFields = [...FORM_FIELDS].reverse();
    expect(formEndpointSchema.parse(settings({ requiredFields })).requiredFields).toEqual(
      requiredFields,
    );
  });

  it("reports the consent dependency on its text field", () => {
    const result = formEndpointSchema.safeParse(settings({ consentEnabled: true }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors).toHaveProperty("consentText");
  });
});

describe("consent compatibility and rendered fields", () => {
  it.each([
    [{}, false],
    [{ consentText: "I agree" }, true],
    [{ consentEnabled: true, consentText: "I agree" }, true],
    [{ consentEnabled: false, consentText: "I agree" }, false],
    [{ consentEnabled: false }, false],
  ] as const)("resolves consent for %j to %s", (overrides, required) => {
    expect(consentRequired(formEndpointSchema.parse(settings(overrides)))).toBe(required);
  });

  it.each(FORM_IDS)("renders the %s base plus unique configured additions", (formId) => {
    const config = settings({ requiredFields: ["organisation", "email", "program", "name"] });
    const before = structuredClone(config);
    const fields = formFields(formId, config);
    expect(fields).toEqual(
      formId === "newsletter"
        ? ["email", "organisation", "program", "name"]
        : ["name", "email", "phone", "message", "organisation", "program"],
    );
    fields.push("phone");
    expect(config).toEqual(before);
    expect(formFields("newsletter", settings())).toEqual(["email"]);
  });
});

describe("form payload validation", () => {
  it.each(FORM_IDS)("validates and trims all configured fields for %s", (formId) => {
    const config = settings({ requiredFields: [...FORM_FIELDS], consentText: "I agree" });
    const values = Object.fromEntries(
      Object.entries(validValues).map(([field, value]) => [field, `  ${value}  `]),
    );
    const before = structuredClone(values);
    const result = validateFormValues(formId, config, { ...values, consent: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ ...validValues, consent: true, website: "" });
    expect(values).toEqual(before);
  });

  it.each(FORM_IDS)(
    "allows missing optional controls but requires configured fields for %s",
    (id) => {
      const config = settings();
      const result = validateFormValues(id, config, { email: validValues.email });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ...(id === "newsletter" ? {} : { name: "", phone: "", message: "" }),
          email: validValues.email,
          consent: false,
          website: "",
        });
      }
      expect(validateFormValues(id, config, {}).success).toBe(false);
    },
  );

  it.each(FORM_FIELDS)("reports missing/blank required %s on its field path", (field) => {
    for (const value of [undefined, "", "  \t\n"]) {
      const result = validateFormValues("newsletter", settings({ requiredFields: [field] }), {
        [field]: value,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.flatten().fieldErrors).toHaveProperty(field);
    }
  });

  it.each(["email", "phone"] as const)("validates optional %s when provided", (field) => {
    const config = settings({ requiredFields: ["name"] });
    for (const value of [undefined, "", "  ", validValues[field]]) {
      expect(
        validateFormValues("generalEnquiry", config, { name: "Example", [field]: value }).success,
      ).toBe(true);
    }
    for (const value of ["not-valid", null, 123, false, [], { value: validValues[field] }]) {
      const result = validateFormValues("generalEnquiry", config, {
        name: "Example",
        [field]: value,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.flatten().fieldErrors).toHaveProperty(field);
    }
  });

  it.each(["123", "-------", "1234567890123456", "555-CALL-NOW", "++44123456789", "1234567 ext 4"])(
    "rejects malformed phone %s",
    (phone) => {
      expect(
        validateFormValues("consultation", settings({ requiredFields: ["phone"] }), { phone })
          .success,
      ).toBe(false);
    },
  );

  it.each(["5550123", "+44 (20) 7946-0958", "(212) 555-0123", "212.555.0123"])(
    "accepts display-formatted phone %s",
    (phone) => {
      expect(
        validateFormValues("consultation", settings({ requiredFields: ["phone"] }), { phone })
          .success,
      ).toBe(true);
    },
  );

  const boundaryValues: [FormFieldId, number, string][] = [
    ["name", 120, "N".repeat(120)],
    ["email", 254, `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(58)}.co`],
    ["phone", 25, `+1${"-".repeat(10)}2345678901234`],
    ["message", 4000, "M".repeat(4000)],
    ["program", 120, "P".repeat(120)],
    ["organisation", 160, "O".repeat(160)],
  ];

  it.each(boundaryValues)("bounds %s at %i trimmed characters", (field, limit, value) => {
    expect(value).toHaveLength(limit);
    const config = settings({ requiredFields: [field] });
    const result = validateFormValues("conversionEnquiry", config, { [field]: ` ${value} ` });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[field]).toBe(value);
    const tooLong = validateFormValues("conversionEnquiry", config, { [field]: `${value}x` });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: "too_big", path: [field] })]),
      );
    }
  });

  it.each(["name", "message"] as const)("also bounds optional free text %s", (field) => {
    expect(
      validateFormValues("generalEnquiry", settings(), {
        email: validValues.email,
        [field]: "x".repeat(4001),
      }).success,
    ).toBe(false);
  });

  it.each(["name", "message", "program", "organisation"] as const)(
    "never interprets or sanitizes HTML-like %s text",
    (field) => {
      const text = '<script>alert("demo")</script> & <img src=x onerror=alert(1)> ${value}';
      const result = validateFormValues("consultation", settings({ requiredFields: [field] }), {
        [field]: `  ${text}  `,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data[field]).toBe(text);
    },
  );

  it.each(FORM_IDS)("requires explicit boolean acceptance iff consent is enabled for %s", (id) => {
    for (const config of [
      settings({ consentText: "I agree" }),
      settings({ consentEnabled: true, consentText: "I agree" }),
    ]) {
      for (const consent of [undefined, false, "true", "on", 1, null]) {
        const result = validateFormValues(id, config, { email: validValues.email, consent });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error.flatten().fieldErrors).toHaveProperty("consent");
      }
      expect(
        validateFormValues(id, config, { email: validValues.email, consent: true }).success,
      ).toBe(true);
    }
    for (const consent of [undefined, false, true]) {
      expect(
        validateFormValues(id, settings({ consentEnabled: false, consentText: "I agree" }), {
          email: validValues.email,
          consent,
        }).success,
      ).toBe(true);
    }
    expect(
      validateFormValues(id, settings(), { email: validValues.email, consent: "false" }).success,
    ).toBe(false);
  });

  it("leaves a populated honeypot for the UI, but validates its type and maximum", () => {
    for (const website of [undefined, "", "https://bot.example.com", "x".repeat(200)]) {
      const result = validateFormValues("newsletter", settings(), {
        email: validValues.email,
        website,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.website).toBe(website ?? "");
    }
    for (const website of ["x".repeat(201), " ".repeat(201), null, true, {}]) {
      const result = validateFormValues("newsletter", settings(), {
        email: validValues.email,
        website,
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.flatten().fieldErrors).toHaveProperty("website");
    }
  });

  it("strips unknown and unrendered payload keys instead of passing them through", () => {
    const result = validateFormValues("newsletter", settings(), {
      email: validValues.email,
      organisation: "Not rendered",
      administrator: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ email: validValues.email, consent: false, website: "" });
    }
  });
});
