import { createDemoMedia } from "../demo-media";
import { apexResources } from "../resource-catalogue";
import sizes from "../../../public/tenants/apex-technology/documents/document-sizes.json";

export const { gallery, downloads } = createDemoMedia("apex-technology", apexResources, sizes);
