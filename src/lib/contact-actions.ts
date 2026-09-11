import type { TenantConfig } from "../config/tenant-schema";

export function getContactActions(
  config: TenantConfig,
): { id: string; label: string; href: string }[] {
  const { contact } = config;
  return [
    { id: "email", label: "Email", href: `mailto:${contact.email}` },
    { id: "phone", label: "Phone", href: `tel:${contact.phone.replace(/[^+\d]/g, "")}` },
    ...(contact.whatsapp
      ? [
          {
            id: "whatsapp",
            label: "WhatsApp",
            href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
          },
        ]
      : []),
    ...(contact.directionsUrl
      ? [{ id: "directions", label: "Directions", href: contact.directionsUrl }]
      : []),
    ...config.integrations.portals.map((portal, index) => ({ id: `portal-${index}`, ...portal })),
  ];
}
