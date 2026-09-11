import { Bell, Download, Search } from "lucide-react";
import { SectionPreview } from "./SectionPreview";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { ResponsiveImage } from "@/components/media/Image";
import {
  Accordion,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardLink,
  CardMeta,
  CardTitle,
  Container,
  Drawer,
  EmptyState,
  ErrorState,
  FormField,
  IconButton,
  Input,
  LinkButton,
  LoadingState,
  Modal,
  Notice,
  Pagination,
  Section,
  SectionHeader,
  Select,
  Stat,
  Tabs,
  Textarea,
} from "@/components/ui";
import { fadeRise, m, staggerContainer, staggerItem } from "@/lib/motion";
import { useTenantConfig, useTerminology } from "@/lib/tenant/TenantProvider";
import { applyThemeToElement, resolveTheme } from "@/themes/apply-theme";
import { themePresets } from "@/themes/theme-presets";
import {
  COLOR_TOKENS,
  SCALAR_TOKENS,
  THEME_PRESET_NAMES,
  THEME_TOKENS,
  cssVariableName,
  type Theme,
  type ThemePresetName,
} from "@/themes/theme-types";

/**
 * Development-only reference for every token and primitive.
 *
 * Registered in `src/routes.ts` only when NODE_ENV is not production, so this module is
 * absent from the production module graph entirely. It renders the real primitives —
 * there is no second, parallel implementation to drift out of sync.
 */

export function meta() {
  return [{ title: "Styleguide" }, { name: "robots", content: "noindex, nofollow" }];
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-10">
      <h2 className="mb-6 font-heading text-h3">{title}</h2>
      {children}
    </section>
  );
}

type ThemePreview = ThemePresetName | "tenant";

function ThemeSwitcher({
  preview,
  onPreviewChange,
  tenantPreset,
}: {
  preview: ThemePreview;
  onPreviewChange: (preview: ThemePreview) => void;
  tenantPreset: ThemePresetName;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <FormField label="Preview a preset" className="w-64">
        <Select
          value={preview}
          onValueChange={(value) => onPreviewChange(value as ThemePreview)}
          options={[
            { value: "tenant", label: `This tenant (${tenantPreset})` },
            ...THEME_PRESET_NAMES.map((name) => ({ value: name, label: name })),
          ]}
        />
      </FormField>
      <p className="max-w-prose text-sm text-muted-foreground">
        Sets the custom properties on <code>:root</code>. Preview only — it changes nothing in the
        tenant config.
      </p>
    </div>
  );
}

function Tokens({ theme }: { theme: Theme }) {
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COLOR_TOKENS.map((token) => (
          <li key={token} className="rounded border border-border bg-card p-3">
            <div
              className="mb-2 h-12 w-full rounded-sm border border-border"
              style={{ background: `hsl(var(${cssVariableName(token)}))` }}
            />
            <p className="text-sm font-medium text-card-foreground">{token}</p>
            <code className="text-xs text-muted-foreground">{cssVariableName(token)}</code>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {SCALAR_TOKENS.map((token) => (
          <div key={token} className="rounded border border-border bg-card p-3">
            <dt className="text-sm font-medium text-card-foreground">{token}</dt>
            <dd className="mt-1 break-words text-sm text-muted-foreground">{theme[token]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function Overlays() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => setModalOpen(true)}>Open modal</Button>
      <Button variant="outline" onClick={() => setDrawerOpen(true)}>
        Open drawer
      </Button>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Modal title"
        description="Focus is trapped, Escape closes, and focus returns to the trigger."
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">Body content sits here.</p>
      </Modal>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer title">
        <p className="text-muted-foreground">
          The same Radix dialog primitive that backs the mobile navigation.
        </p>
      </Drawer>
    </div>
  );
}

function Forms() {
  return (
    <div className="grid max-w-narrow gap-4">
      <FormField label="Full name" required description="As it appears on official documents.">
        <Input placeholder="Alex Morgan" autoComplete="name" />
      </FormField>

      <FormField label="Enquiry type">
        <Select
          defaultValue="general"
          options={[
            { value: "general", label: "General enquiry" },
            { value: "visit", label: "Book a visit" },
            { value: "other", label: "Something else" },
          ]}
        />
      </FormField>

      <FormField label="Message" description="A few sentences is plenty.">
        <Textarea placeholder="How can we help?" />
      </FormField>

      <FormField label="Email address" required error="Enter a valid email address.">
        <Input type="email" defaultValue="not-an-email" />
      </FormField>
    </div>
  );
}

function MotionDemo() {
  const items = ["One", "Two", "Three", "Four"];
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-muted-foreground">
        Variants come from <code>src/lib/motion</code>. The list below is one staggered group, not
        four independent timers, and all of it stops when reduced motion is set.
      </p>
      <m.ul
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-4"
      >
        {items.map((item) => (
          <m.li
            key={item}
            variants={staggerItem}
            className="rounded border border-border bg-card p-4 text-card-foreground"
          >
            {item}
          </m.li>
        ))}
      </m.ul>
      <m.div
        variants={fadeRise}
        initial="hidden"
        animate="visible"
        className="rounded border border-border bg-card p-4"
      >
        fadeRise
      </m.div>
    </div>
  );
}

export default function Styleguide() {
  const tenant = useTenantConfig();
  const terminology = useTerminology();
  const [page, setPage] = useState(2);
  const [preview, setPreview] = useState<ThemePreview>("tenant");
  const theme = useMemo(
    () => (preview === "tenant" ? resolveTheme(tenant.theme) : themePresets[preview]),
    [preview, tenant.theme],
  );

  useEffect(() => {
    const element = document.documentElement;
    const previous = THEME_TOKENS.map((token) => {
      const property = cssVariableName(token);
      return {
        property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      };
    });

    applyThemeToElement(theme, element);

    // React also cleans up before the next preview, so each snapshot starts from
    // the original inline tokens. Leave unrelated (even newly changed) styles alone.
    return () => {
      for (const { property, value, priority } of previous) {
        if (value !== "") element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      }
    };
  }, [theme]);

  return (
    <Container className="py-12">
      <h1 className="font-heading text-h1">Styleguide</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Development only. Active tenant: {tenant.brand.name} · preset {tenant.theme.preset}.
      </p>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        Terminology in use: {terminology.programPlural} · {terminology.peopleSectionLabel} ·{" "}
        {terminology.primaryConversionLabel} · {terminology.facilitiesLabel} ·{" "}
        {terminology.audiencePlural}
      </p>

      <div className="mt-6">
        <ThemeSwitcher
          preview={preview}
          onPreviewChange={setPreview}
          tenantPreset={tenant.theme.preset}
        />
      </div>

      <Block title="Tokens">
        <Tokens theme={theme} />
      </Block>

      <Block title="Typography">
        <div className="space-y-3">
          <p className="font-heading text-display">Display</p>
          <p className="font-heading text-h1">Heading 1</p>
          <p className="font-heading text-h2">Heading 2</p>
          <p className="font-heading text-h3">Heading 3</p>
          <p className="max-w-prose text-lg">Lead paragraph.</p>
          <p className="max-w-prose">
            Body copy at the 16px floor, set with a comfortable measure of roughly seventy
            characters so long lines never become hard to track.
          </p>
          <p className="text-sm text-muted-foreground">Small — meta, captions and labels.</p>
        </div>
      </Block>

      <Block title="SectionHeader">
        <SectionHeader
          eyebrow="Eyebrow"
          title="Section heading"
          description="A supporting sentence that explains what the section contains."
          actions={
            <LinkButton href={tenant.pages.home.path} variant="outline" size="sm">
              View all
            </LinkButton>
          }
        />
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" leadingIcon={<Download className="h-4 w-4" />}>
            With icon
          </Button>
          <IconButton label="Search" variant="outline" icon={<Search className="h-5 w-5" />} />
          <LinkButton href={tenant.pages.home.path}>Link button</LinkButton>
          <LinkButton href="https://example.com" isExternal variant="outline">
            External link button
          </LinkButton>
        </div>
      </Block>

      <Block title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="outline">Outline</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="destructive">Error</Badge>
        </div>
      </Block>

      <Block title="Breadcrumbs">
        <Breadcrumbs
          items={[
            { label: "Home", href: tenant.pages.home.path },
            { label: terminology.programPlural, href: tenant.pages.programs.path },
            { label: "Current page" },
          ]}
        />
      </Block>

      <Block title="Cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Plain card</CardTitle>
              <CardMeta>Not interactive</CardMeta>
            </CardHeader>
            <CardBody>A container with a border and no link.</CardBody>
          </Card>

          <Card as="article" interactive elevation="sm">
            <CardHeader>
              <CardTitle>
                <CardLink href={tenant.pages.home.path}>Linked card</CardLink>
              </CardTitle>
              <CardMeta>One link covers the card</CardMeta>
            </CardHeader>
            <CardBody>The whole card activates, but there is exactly one tab stop.</CardBody>
          </Card>

          <Card as="article" interactive elevation="sm">
            <CardHeader>
              <CardTitle>
                <CardLink href={tenant.pages.home.path}>With footer</CardLink>
              </CardTitle>
            </CardHeader>
            <CardBody>Meta below.</CardBody>
            <CardFooter>
              <Badge tone="outline">Tag</Badge>
            </CardFooter>
          </Card>

          <Card padding="none" interactive elevation="sm">
            <ResponsiveImage
              src={tenant.brand.favicon}
              alt=""
              width={320}
              height={180}
              aspect="16/9"
              className="rounded-t"
            />
            <div className="p-5">
              <CardTitle>
                <CardLink href={tenant.pages.home.path}>Media card</CardLink>
              </CardTitle>
              <CardBody className="mt-2">Decorative image, so its alt is empty.</CardBody>
            </div>
          </Card>
        </div>
      </Block>

      <Block title="Stats">
        <div className="grid gap-6 sm:grid-cols-3">
          <Stat label="Founded" value="1998" isDemoContent />
          <Stat label="Sample metric" value="24" caption="Illustrative only" isDemoContent />
          <Stat label="Verified metric" value="6" isDemoContent={false} />
        </div>
      </Block>

      <Block title="Notices, empty, error and loading states">
        <div className="grid gap-4">
          <Notice title="Information">Something worth knowing.</Notice>
          <Notice tone="success" title="Saved" live>
            Your changes were stored.
          </Notice>
          <Notice tone="warning" title="Check this">
            One field needs attention.
          </Notice>
          <Notice tone="destructive" title="Failed" live>
            That did not work.
          </Notice>
          <EmptyState
            title="Nothing here yet"
            description="When there is content, it appears in this area."
            action={<Button variant="outline">Refresh</Button>}
          />
          <ErrorState
            title="Could not load"
            description="An unexpected error occurred."
            action={<Button variant="outline">Try again</Button>}
          />
          <LoadingState label="Loading results" />
        </div>
      </Block>

      <Block title="Accordion">
        <Accordion
          items={[
            { id: "one", question: "First question", answer: "A concise answer." },
            { id: "two", question: "Second question", answer: "Another concise answer." },
          ]}
        />
      </Block>

      <Block title="Tabs">
        <Tabs
          label="Example tabs"
          items={[
            { id: "overview", label: "Overview", content: <p>Overview panel.</p> },
            { id: "details", label: "Details", content: <p>Details panel.</p> },
          ]}
        />
      </Block>

      <Block title="Overlays">
        <Overlays />
      </Block>

      <Block title="Forms">
        <Forms />
      </Block>

      <Block title="Pagination">
        <Pagination currentPage={page} totalPages={5} buildHref={(next) => `?page=${next}`} />
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Simulate previous
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(5, p + 1))}>
            Simulate next
          </Button>
        </div>
      </Block>

      <Block title="Section backgrounds">
        <SectionPreview />
        <div className="overflow-hidden rounded border border-border">
          {(["default", "surface", "tinted", "muted", "inverted"] as const).map((tone) => (
            <Section key={tone} tone={tone} density="compact">
              <Container>
                <p className="font-medium">{tone}</p>
              </Container>
            </Section>
          ))}
        </div>
      </Block>

      <Block title="Motion">
        <MotionDemo />
      </Block>

      <Block title="Icon buttons">
        <div className="flex flex-wrap gap-3">
          <IconButton label="Notifications" icon={<Bell className="h-5 w-5" />} variant="ghost" />
          <IconButton label="Search" icon={<Search className="h-5 w-5" />} variant="outline" />
          <IconButton label="Download" icon={<Download className="h-5 w-5" />} />
        </div>
      </Block>
    </Container>
  );
}
