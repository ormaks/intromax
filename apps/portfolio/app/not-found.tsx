import type { Metadata } from "next";
import { NotFoundScene } from "@/components/notFoundScene";

export const metadata: Metadata = {
  title: "Page not found - Ormaks",
};

export default function NotFound() {
  return <NotFoundScene />;
}
