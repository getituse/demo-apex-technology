import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface AccordionItemData {
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  /** Multiple panels open at once, or one at a time. */
  type?: "single" | "multiple";
  defaultOpenIds?: string[];
  className?: string;
  headingLevel?: "h2" | "h3" | "h4";
}

export function Accordion({
  items,
  type = "single",
  defaultOpenIds = [],
  className,
  headingLevel: Heading = "h3",
}: AccordionProps) {
  const shared = {
    className: cn("divide-y divide-border rounded border border-border bg-card", className),
  };

  const content = items.map((item) => (
    <RadixAccordion.Item key={item.id} value={item.id}>
      <RadixAccordion.Header asChild>
        <Heading>
          <RadixAccordion.Trigger
            className={cn(
              "group flex w-full items-center justify-between gap-4 p-4 text-left font-medium text-card-foreground",
              "min-h-11 hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring",
            )}
          >
            {item.question}
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </RadixAccordion.Trigger>
        </Heading>
      </RadixAccordion.Header>
      {/* Height is animated by Radix's own CSS variable, so no layout-thrashing JS. */}
      <RadixAccordion.Content className="overflow-hidden data-[state=closed]:animate-none">
        <div className="p-4 pt-0 text-muted-foreground">{item.answer}</div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  ));

  if (type === "multiple") {
    return (
      <RadixAccordion.Root type="multiple" defaultValue={defaultOpenIds} {...shared}>
        {content}
      </RadixAccordion.Root>
    );
  }

  return (
    <RadixAccordion.Root type="single" collapsible defaultValue={defaultOpenIds[0]} {...shared}>
      {content}
    </RadixAccordion.Root>
  );
}
