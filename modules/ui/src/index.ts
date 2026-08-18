/**
 * Shared design-system components used across apps.
 *
 * Generic primitives only. Anything that encodes one app's nav, branding or
 * copy stays in that app (see AGENTS.md) — the portfolio's Header, TextSplit
 * and Preloader live in apps/portfolio/components for that reason.
 *
 * `Link` and `ButtonLink` wrap `next/link`, which is what puts `next` in this
 * module's peerDependencies — every app in the workspace is a Next app today,
 * so that isn't blocking anything, but it's the one thing that would stop a
 * non-Next app from using `@intromax/ui` at all.
 */

export { Button, ButtonLink } from "./button";
export type { ButtonLinkProps, ButtonProps } from "./button";
export { Card } from "./card";
export type { CardProps } from "./card";
export { Container } from "./container";
export type { ContainerProps } from "./container";
export { Input } from "./input";
export type { InputProps } from "./input";
export { Link } from "./link";
export type { LinkProps } from "./link";
export { TextArea } from "./textArea";
export type { TextAreaProps } from "./textArea";
export { ToastHost, toastError, toastInfo, toastSuccess } from "./toast";
export type { ToastVariant } from "./toast";
export { Heading, Text } from "./typography";
export type { HeadingProps, TextProps } from "./typography";

export { cn } from "./utils/cn";
