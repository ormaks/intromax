import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Renders the legacy red underline plus an inline message below the field. */
  error?: string;
  /** Label text rendered above the field. Omit to render just the textarea. */
  label?: string;
};

/**
 * Input's multi-line sibling. Legacy `contact.scss` fixes the height between
 * 150px and 250px and allows vertical resize only.
 */
export function TextArea({
  className,
  error,
  id,
  label,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  const field = (
    <>
      <textarea
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={errorId}
        className={cn(
          "w-full border-0 bg-field text-base text-foreground",
          "border-b-2 transition-all duration-300",
          "placeholder:text-muted",
          "hover:bg-[rgba(8,253,216,0.13)] hover:shadow-[inset_0_0_20px_#08fdd96e]",
          "focus:bg-[rgba(8,253,216,0.04)] focus:shadow-[inset_0_0_10px_#08fdd96e] focus:outline-none",
          error ? "border-danger" : "border-accent",
          "min-h-[150px] max-h-[250px] resize-y p-5",
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="font-tag text-tag text-danger">
          {error}
        </p>
      )}
    </>
  );

  if (!label) {
    return field;
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-tag text-tag">
        {label}
      </label>
      {field}
    </div>
  );
}
