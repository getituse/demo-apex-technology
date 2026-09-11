import type { TenantConfig } from "@/config/tenant-schema";
import type { TenantContent } from "@/config/content-schema";
import { tenantConfigSchema } from "@/config/tenant-schema";
import { tenantContentSchema } from "@/config/content-schema";
import { rawConfig } from "@/site/config";
import { rawContent } from "@/site/content";

/**
 * A real, schema-valid tenant for component tests.
 *
 * Using an actual tenant rather than a hand-rolled stub means a component test fails if
 * the schema and the components drift apart, which a stub would quietly hide.
 */
export const testConfig: TenantConfig = tenantConfigSchema.parse(rawConfig);
export const testContent: TenantContent = tenantContentSchema.parse(rawContent);
