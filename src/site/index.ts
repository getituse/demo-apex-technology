import { tenantContentSchema } from "../config/content-schema";
import { tenantConfigSchema } from "../config/tenant-schema";

import { rawConfig } from "./config";
import { rawContent } from "./content";

// Parsed at module load, so invalid tenant data fails the build rather than the browser.
export const config = tenantConfigSchema.parse(rawConfig);
export const content = tenantContentSchema.parse(rawContent);
