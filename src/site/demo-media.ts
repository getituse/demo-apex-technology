import type { Download, GalleryItem } from "../config/content-schema";
import { galleryIllustration } from "../lib/placeholder-media";
import type { DemoResourceCatalogue } from "./resource-catalogue";

export function createDemoMedia(
  tenantId: string,
  catalogue: DemoResourceCatalogue,
  documentSizes: Record<string, number>,
): { gallery: GalleryItem[]; downloads: Download[] } {
  const base = `/tenants/${tenantId}`;
  return {
    gallery: catalogue.gallery.map((subject, index) => ({
      id: `illustration-${index + 1}`,
      album: "Original demonstration illustrations",
      image: galleryIllustration(`${base}/images`, index + 1),
      caption: `${subject} — fictional scene illustrated for this demo`,
    })),
    downloads: catalogue.documents.map((document) => {
      const bytes = documentSizes[document.id];
      if (!bytes || bytes < 100)
        throw new Error(`Missing generated document: ${tenantId}/${document.id}`);
      return {
        id: document.id,
        category: document.category,
        title: document.title,
        description: document.description,
        file: `${base}/documents/${document.id}.pdf`,
        fileType: "pdf",
        fileSizeKb: Math.ceil(bytes / 1024),
        updatedAt: "2026-09-09",
      };
    }),
  };
}
