import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Renders the legacy red underline plus an inline message below the field. */
  error?: string;
  /** Label text rendered above the field. Omit to render just the input. */
  label?: string;
};

/**
 * Legacy contact-form field (`contact.scss`): filled grey box, accent
 * underline, inner glow on hover and focus.
 */
export function Input({ className, error, id, label, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  const field = (
    <>
      <input
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
          "h-field px-5",
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
