import type { TenantContentInput } from "../../config/content-schema";
import { editorial } from "./editorial";
import { gallery, downloads } from "./media";
import { pageSections } from "./sections";

/** Editorial, media and composition stay separate to avoid circular imports. */
export const rawContent = {
  ...editorial,
  gallery,
  downloads,
  pageSections,
} satisfies TenantContentInput;
