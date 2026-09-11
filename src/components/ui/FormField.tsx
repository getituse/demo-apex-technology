import { createContext, useContext, useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface FieldContextValue {
  inputId: string;
  descriptionId?: string | undefined;
  errorId?: string | undefined;
  hasError: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Owns the id wiring so a control can never be left unlabelled or an error message
 * left unannounced. Controls read it through `useFieldControlProps` and spread the
 * result, rather than each caller remembering `aria-describedby` by hand.
 */
export function useFieldControlProps() {
  const field = useContext(FieldContext);
  if (!field) {
    throw new Error("Form controls must be rendered inside <FormField>.");
  }

  const describedBy = [field.descriptionId, field.errorId].filter(Boolean).join(" ");

  return {
    id: field.inputId,
    "aria-describedby": describedBy === "" ? undefined : describedBy,
    "aria-invalid": field.hasError || undefined,
    required: field.required,
  };
}

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  requiredHint?: string;
  className?: string;
}

export function FormField({
  label,
  children,
  description,
  error,
  required = false,
  requiredHint = "required",
  className,
}: FormFieldProps) {
  const baseId = useId();
  const inputId = `${baseId}-control`;
  const descriptionId = description ? `${baseId}-description` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;

  return (
    <FieldContext.Provider
      value={{ inputId, descriptionId, errorId, hasError: Boolean(error), required }}
    >
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
          {required ? (
            <>
              {/* The asterisk is decorative; the word is what gets announced. */}
              <span aria-hidden="true" className="ml-1 text-destructive">
                *
              </span>
              <span className="sr-only"> ({requiredHint})</span>
            </>
          ) : null}
        </label>

        {description ? (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}

        {children}

        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

/** Shared field chrome, so Input, Textarea and Select cannot drift apart. */
export const fieldControlClasses = cn(
  "w-full rounded border border-input bg-surface px-3 py-2 text-foreground",
  "min-h-11 placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-destructive",
);
