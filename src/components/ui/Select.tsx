import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { fieldControlClasses, useFieldControlProps } from "./FormField";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select an option",
  name,
  disabled,
  className,
}: SelectProps) {
  const fieldProps = useFieldControlProps();

  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
      required={fieldProps.required}
    >
      <RadixSelect.Trigger
        id={fieldProps.id}
        aria-describedby={fieldProps["aria-describedby"]}
        aria-invalid={fieldProps["aria-invalid"]}
        className={cn(fieldControlClasses, "flex items-center justify-between gap-2", className)}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-border bg-surface-elevated shadow-md"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "flex min-h-11 cursor-pointer select-none items-center justify-between gap-2 rounded-sm px-3 py-2 text-foreground",
                  "data-[highlighted]:bg-muted data-[highlighted]:outline-none",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check aria-hidden="true" className="h-4 w-4" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
