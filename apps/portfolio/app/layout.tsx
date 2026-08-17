import type { Metadata } from "next";
import { cn } from "@intromax/ui";
import { Header } from "@/components/header";
import { Preloader } from "@/components/preloader";
import { fontVariables } from "@/styles/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Ormaks — Maks Chytailo",
  description: "Frontend developer. Portfolio, projects and contact.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(fontVariables, "h-full antialiased")}>
      <body className="min-h-full flex flex-col font-sans">
        <Preloader />

        {/* The nav rail precedes content on every route. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-40 focus:m-2 focus:rounded-control focus:border focus:border-accent focus:bg-surface focus:px-3 focus:py-2 focus:text-accent"
        >
          Skip to content
        </a>

        <Header />
        {/* The header is a fixed `w-header` rail from `sm` up; this clears it. */}
        <main id="main" className="flex-1 sm:pl-(--width-header)">
          {children}
        </main>
      </body>
    </html>
  );
}
