import type { ButtonHTMLAttributes } from "react";
import { buttonClassName, type ButtonSize } from "../utils/buttonClassName";
import { cn } from "../utils/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: ButtonSize;
};

/** The site's button treatment on a real `<button>`. */
export function Button({
  className,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(
        cn(
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:hover:bg-transparent disabled:hover:text-accent",
          className,
        ),
        size,
      )}
      {...props}
    />
  );
}
