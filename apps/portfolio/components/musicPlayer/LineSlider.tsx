import { cn } from "@intromax/ui";
import type { KeyboardEvent, PointerEvent } from "react";

type LineSliderProps = {
  label: string;
  /** Filled share of the line, 0-1. */
  fraction: number;
  valueMax: number;
  valueNow: number;
  valueText?: string;
  /** Called with the pointer's share of the line while pressing or dragging. */
  onFraction(fraction: number): void;
  onDragChange?(dragging: boolean): void;
  onKeyDown(event: KeyboardEvent<HTMLDivElement>): void;
  className?: string;
};

/**
 * The player's slider: a thin line with an accent fill ending in a glowing
 * dot. Click or drag anywhere on it, or use the keys the caller handles.
 */
export function LineSlider({
  label,
  fraction,
  valueMax,
  valueNow,
  valueText,
  onFraction,
  onDragChange,
  onKeyDown,
  className,
}: LineSliderProps) {
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const share = (event.clientX - bounds.left) / bounds.width;
    onFraction(Math.max(0, Math.min(share, 1)));
  };

  const endDrag = () => onDragChange?.(false);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={valueMax}
      aria-valuenow={valueNow}
      aria-valuetext={valueText}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onDragChange?.(true);
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          fromPointer(event);
        }
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex h-4 cursor-pointer touch-none items-center",
        className,
      )}
    >
      <div className="relative h-0.5 w-full bg-border">
        <div
          className="relative h-full bg-accent"
          style={{ width: `${fraction * 100}%` }}
        >
          <div className="absolute top-1/2 right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent),0_0_8px_var(--color-accent)]" />
        </div>
      </div>
    </div>
  );
}
