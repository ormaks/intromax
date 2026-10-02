import { Text } from "@intromax/ui";

type CodeTagProps = {
  /** The tag name to render, without angle brackets — e.g. `h1`. */
  name: string;
  /** Renders the closing form, `</h1>`. */
  closing?: boolean;
  /** Renders the self-closing form, `<cv />`, used as a small section title. */
  selfClosing?: boolean;
  /**
   * Prefixes three non-breaking spaces. The page frame indents `<body>` and
   * `</body>` this way, so `</html>` sits further left than the body tags —
   * the way real nested markup reads.
   */
  indent?: boolean;
  className?: string;
};

/**
 * The site's "code as design" motif: literal markup rendered as decoration
 * around real content.
 *
 * `aria-hidden` is the whole reason this exists as a component. Without it
 * every route announces "less than h 1 greater than" before and after its
 * heading — the brackets are ornament, not content, and there are two of these
 * on every page.
 */
export function CodeTag({
  name,
  closing = false,
  selfClosing = false,
  indent = false,
  className,
}: CodeTagProps) {
  return (
    <Text variant="tag" aria-hidden="true" className={className}>
      {`${indent ? "   " : ""}<${closing ? "/" : ""}${name}${selfClosing ? " /" : ""}>`}
    </Text>
  );
}
