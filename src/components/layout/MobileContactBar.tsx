import { Mail, MessageCircle, Phone } from "lucide-react";

import { cn } from "@/lib/cn";
import { EXTERNAL_LINK_PROPS, useTenantConfig } from "@/lib/tenant/TenantProvider";

const actionClasses =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring";

/**
 * Fixed bar of contact actions on small screens only. Enabled per tenant, and padded
 * for by `SiteLayout` so it never covers the end of the page content.
 */
export function MobileContactBar({ className }: { className?: string }) {
  const config = useTenantConfig();
  if (!config.features.mobileContactBar) return null;

  const { phone, email, whatsapp } = config.contact;
  const digits = (value: string) => value.replace(/[^\d+]/g, "");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface-elevated shadow-lg lg:hidden",
        className,
      )}
    >
      <a href={`tel:${digits(phone)}`} className={actionClasses}>
        <Phone aria-hidden="true" className="h-5 w-5" />
        Call
      </a>
      <a href={`mailto:${email}`} className={cn(actionClasses, "border-l border-border")}>
        <Mail aria-hidden="true" className="h-5 w-5" />
        Email
      </a>
      {whatsapp ? (
        <a
          href={`https://wa.me/${digits(whatsapp).replace("+", "")}`}
          className={cn(actionClasses, "border-l border-border")}
          {...EXTERNAL_LINK_PROPS}
        >
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
          WhatsApp
        </a>
      ) : null}
    </div>
  );
}
