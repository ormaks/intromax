"use client";

import { cn } from "@intromax/ui";
import Image from "next/image";
import { useRef, useState } from "react";
import { MEDIA } from "@/constants/breakpoints";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PDF = "/cv/maks-chytailo-cv.pdf";
const THUMBNAIL = "/cv/maks-chytailo-cv.png";
const FILE_NAME = "cv_maks_chytailo.pdf";
const DOWNLOAD_NAME = "Maks-Chytailo-CV.pdf";

const ACTION =
  "cursor-pointer border-b border-dashed border-accent/50 p-0 font-mono text-caption text-accent no-underline transition-colors duration-300 hover:border-accent";

/**
 * The CV as a card: a thumbnail of the first page that tilts on hover, with
 * preview and download.
 *
 * Preview opens the PDF in a dialog (the browser's own PDF viewer in a
 * frame), with download and close. Phone browsers don't reliably show PDFs
 * inside a frame, so on mobile preview opens the PDF in a new tab instead.
 */
export function CvCard({ className }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inPage = useMediaQuery(MEDIA.tabletUp);

  const open = () => {
    setIsOpen(true);
    dialog.current?.showModal();
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-control border border-border bg-surface p-3",
        className,
      )}
    >
      {inPage ? (
        <button
          type="button"
          onClick={open}
          tabIndex={-1}
          aria-hidden="true"
          className="shrink-0 cursor-pointer p-0"
        >
          <Thumbnail />
        </button>
      ) : (
        <Thumbnail />
      )}

      <div className="flex min-w-0 flex-col gap-1">
        <p className="m-0 truncate font-mono text-sm text-accent">
          {FILE_NAME}
        </p>
        <p className="m-0 text-caption text-subtle">
          Senior Frontend Developer · 2 pages
        </p>
        <div className="flex gap-4 pt-1">
          {inPage ? (
            <button type="button" onClick={open} className={ACTION}>
              preview
            </button>
          ) : (
            <a
              href={PDF}
              target="_blank"
              rel="noopener noreferrer"
              className={ACTION}
            >
              preview
            </a>
          )}
          <a href={PDF} download={DOWNLOAD_NAME} className={ACTION}>
            download
          </a>
        </div>
      </div>

      <dialog
        ref={dialog}
        aria-label="CV preview"
        onClose={() => setIsOpen(false)}
        className="m-auto h-5/6 w-full max-w-3xl flex-col overflow-hidden rounded-control border border-border bg-surface p-0 text-foreground open:flex backdrop:bg-background/80"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2">
          <p className="m-0 truncate font-mono text-sm text-accent">
            {FILE_NAME}
          </p>
          <div className="flex shrink-0 gap-4">
            <a href={PDF} download={DOWNLOAD_NAME} className={ACTION}>
              download
            </a>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className={ACTION}
            >
              close
            </button>
          </div>
        </div>
        {/* Only loaded once opened, so the page doesn't fetch the PDF. */}
        {isOpen && (
          <iframe title="CV" src={PDF} className="w-full flex-1 bg-white" />
        )}
      </dialog>
    </div>
  );
}

function Thumbnail() {
  return (
    <Image
      src={THUMBNAIL}
      alt=""
      width={60}
      height={85}
      // A small static file; served as is, without the image optimizer.
      unoptimized
      className="shrink-0 rounded-xs transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"
    />
  );
}
