import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  /** Names the tab list when a page has more than one. */
  label: string;
  className?: string;
}

export function Tabs({ items, defaultId, label, className }: TabsProps) {
  if (items.length === 0) return null;

  return (
    <RadixTabs.Root defaultValue={defaultId ?? items[0]?.id} className={cn("w-full", className)}>
      <RadixTabs.List aria-label={label} className="flex flex-wrap gap-1 border-b border-border">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.id}
            value={item.id}
            className={cn(
              "-mb-px min-h-11 border-b-2 border-transparent px-4 py-2 text-muted-foreground",
              "hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring",
              "data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-primary",
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) => (
        <RadixTabs.Content
          key={item.id}
          value={item.id}
          className="py-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
