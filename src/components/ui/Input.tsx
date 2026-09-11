import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { fieldControlClasses, useFieldControlProps } from "./FormField";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  const fieldProps = useFieldControlProps();
  return (
    <input ref={ref} className={cn(fieldControlClasses, className)} {...fieldProps} {...props} />
  );
});
