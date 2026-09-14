import { useId } from "react";

import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { assetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";
import type { DownloadCardData } from "@/sections/section-types";
import type { ContentCardProps } from "./ContentCardFrame";
import { formatCardDate } from "./card-date";

const mimeTypes: Record<DownloadCardData["fileType"], string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
};

const sizeFormatter = new Intl.NumberFormat("en-GB", { maximumSignificantDigits: 4 });

export function DownloadCard({
  item,
  headingTag = "h3",
  className,
}: ContentCardProps<DownloadCardData>) {
  const titleId = useId();
  const metadataId = useId();
  return (
    <Card
      as="article"
      aria-labelledby={titleId}
      interactive
      className={cn(
        "flex h-full min-w-0 flex-col break-words",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30",
        "motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
    >
      <CardHeader>
        <CardTitle id={titleId} as={headingTag}>
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        {item.summary ? <p>{item.summary}</p> : null}
        <dl id={metadataId} className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="font-medium text-card-foreground">File type</dt>
            <dd>{item.fileType.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="font-medium text-card-foreground">Size</dt>
            <dd>{sizeFormatter.format(item.fileSizeKb)} KB</dd>
          </div>
          <div>
            <dt className="font-medium text-card-foreground">Updated</dt>
            <dd>
              <time dateTime={item.updatedAt}>{formatCardDate(item.updatedAt)}</time>
            </dd>
          </div>
        </dl>
      </CardBody>
      <CardFooter className="mt-auto pt-5">
        <a
          href={assetUrl(item.file)}
          download
          type={mimeTypes[item.fileType]}
          aria-describedby={metadataId}
          className="font-medium text-primary underline underline-offset-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          Download {item.title}
        </a>
      </CardFooter>
    </Card>
  );
}
