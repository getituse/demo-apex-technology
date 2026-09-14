import { useId, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { ResponsiveImage, type ImageAspect } from "@/components/media/Image";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardFooter, CardHeader, CardLink, CardTitle } from "@/components/ui/Card";
import type { ContentCardData } from "@/sections/section-types";

export interface ContentCardProps<T> {
  item: T;
  demoLabel?: string;
  headingTag?: "h2" | "h3" | "h4" | "h5";
  className?: string;
}

export function DemoContentLabel({ label = "Sample content" }: { label?: string }) {
  return <Badge className="self-start">{label.trim() || "Sample content"}</Badge>;
}

export function CardItemList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

interface ContentCardFrameProps extends ContentCardProps<ContentCardData> {
  children?: ReactNode;
  meta?: ReactNode;
  imageAspect?: ImageAspect;
}

export function ContentCardFrame({
  item,
  demoLabel,
  headingTag = "h3",
  children,
  meta,
  imageAspect = "4/3",
}: ContentCardFrameProps) {
  const titleId = useId();
  const action = item.action;
  const isNativeLink = action && /^(mailto:|tel:|#)/.test(action.href);
  const actionText = action ? (
    <>
      {action.label}
      {action.label !== item.title && <span className="sr-only"> — {item.title}</span>}
    </>
  ) : null;

  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      interactive={Boolean(action)}
      padding="none"
      className="flex h-full min-w-0 flex-col break-words"
    >
      {item.image ? (
        <div className="overflow-hidden rounded-t">
          <ResponsiveImage
            {...item.image}
            aspect={imageAspect}
            className="w-full rounded-t"
            imgClassName="transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
        <CardHeader className="gap-2">
          {item.isDemoContent ? <DemoContentLabel label={demoLabel} /> : null}
          {meta}
          <CardTitle id={titleId} as={headingTag}>
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p>{item.summary}</p>
          {children}
        </CardBody>
        {action ? (
          <CardFooter className="mt-auto pt-5">
            {isNativeLink ? (
              <a
                href={action.href}
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                <span>{actionText}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </a>
            ) : (
              <CardLink
                href={action.href}
                isExternal={action.href.startsWith("https://")}
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 group-hover:underline"
              >
                <span>{actionText}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </CardLink>
            )}
          </CardFooter>
        ) : null}
      </div>
    </Card>
  );
}
