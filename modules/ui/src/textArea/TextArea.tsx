import type { TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { fieldClassName } from "../utils/fieldClassName";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Renders the legacy red underline. Also sets `aria-invalid`. */
  error?: boolean;
};

/**
 * Input's multi-line sibling. Legacy `contact.scss` fixes the height between
 * 150px and 250px and allows vertical resize only.
 */
export function TextArea({
  className,
  error = false,
  ...props
}: TextAreaProps) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        fieldClassName(error),
        "min-h-[150px] max-h-[250px] resize-y p-5",
        className,
      )}
      {...props}
    />
  );
}
