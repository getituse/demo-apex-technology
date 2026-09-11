import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus";
import { AnimatePresence, m, modal, overlay } from "@/lib/motion";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

/**
 * Radix Dialog underneath, so focus trapping, Escape, focus return, `aria-modal` and
 * body scroll locking are handled by an implementation that already gets them right.
 *
 * `forceMount` hands presence to AnimatePresence: without it Radix would unmount the
 * panel immediately and the exit animation would never run.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = "Close",
  className,
}: ModalProps) {
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
              <div
                aria-modal="true"
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2"
              >
                {/* Positioning and animation must not write the same transform. */}
                <m.div
                  variants={modal}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "max-h-[85vh] overflow-y-auto rounded border border-border bg-surface-elevated p-6 shadow-lg",
                    className,
                  )}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
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
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <X aria-hidden="true" className="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div className="text-foreground">{children}</div>
                  {footer ? <div className="mt-6 flex flex-wrap gap-3">{footer}</div> : null}
                </m.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
