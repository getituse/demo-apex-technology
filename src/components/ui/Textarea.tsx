import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { fieldControlClasses, useFieldControlProps } from "./FormField";

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  const fieldProps = useFieldControlProps();
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(fieldControlClasses, "resize-y", className)}
      {...fieldProps}
      {...props}
    />
  );
});
