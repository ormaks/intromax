import type { ButtonHTMLAttributes } from "react";
import { buttonClassName } from "../utils/buttonClassName";
import { cn } from "../utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** The legacy `.contact_btn` treatment on a real button. */
export function Button({ className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(
        cn(
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:hover:bg-transparent disabled:hover:text-accent",
          className,
        ),
      )}
      {...props}
    />
  );
}
