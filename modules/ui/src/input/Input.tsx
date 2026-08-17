import type { InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { fieldClassName } from "../utils/fieldClassName";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Renders the legacy red underline. Also sets `aria-invalid`. */
  error?: boolean;
};

/**
 * Legacy contact-form field (`contact.scss`): filled grey box, accent
 * underline, inner glow on hover and focus.
 */
export function Input({ className, error = false, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(fieldClassName(error), "h-field px-5", className)}
      {...props}
    />
  );
}
