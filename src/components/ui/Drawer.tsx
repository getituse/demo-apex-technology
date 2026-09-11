import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus";
import { AnimatePresence, drawer, m, overlay } from "@/lib/motion";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the dialog. Visually hidden when `hideTitle` is set. */
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}

/**
 * Side panel used for mobile navigation.
 *
 * Radix Dialog supplies the six behaviours the brief demands of it — focus trap,
 * Escape to close, focus returned to the trigger, body scroll lock, correct labelling,
 * and `aria-modal` — none of which are worth reimplementing by hand.
 *
 * `overflow-x-hidden` on the panel guarantees the drawer cannot introduce a horizontal
 * scrollbar on a narrow viewport.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
  closeLabel = "Close",
  className,
}: DrawerProps) {
  const returnFocus = useDialogReturnFocus(open);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence onExitComplete={returnFocus}>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                variants={overlay}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-50 bg-foreground/50"
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              forceMount
              {...(description ? {} : { "aria-describedby": undefined })}
              // Radix would restore focus now, while the panel is still animating out.
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <m.div
                variants={drawer}
                initial="hidden"
                animate="visible"
                exit="exit"
                // Radix marks the rest of the tree aria-hidden rather than setting this;
                // both are valid, and stating it explicitly is the clearer contract.
                aria-modal="true"
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex w-[min(22rem,100vw)] flex-col",
                  "overflow-y-auto overflow-x-hidden border-l border-border bg-surface-elevated shadow-lg",
                  className,
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-border p-4">
                  <div className={cn(hideTitle && "sr-only")}>
                    <Dialog.Title className="font-heading text-h3 text-foreground">
                      {title}
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <Dialog.Close
                    aria-label={closeLabel}
                    className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                  >
                    <X aria-hidden="true" className="h-5 w-5" />
                  </Dialog.Close>
                </div>

                <div className="flex-1 p-4">{children}</div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
