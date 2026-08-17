import { Text } from "@intromax/ui";

type CodeTagProps = {
  /** The tag name to render, without angle brackets — e.g. `h1`. */
  name: string;
  /** Renders the closing form, `</h1>`. */
  closing?: boolean;
};

/**
 * The legacy site's "code as design" motif: literal markup rendered as
 * decoration around real content.
 *
 * `aria-hidden` is the whole reason this exists as a component. Without it
 * every route announces "less than h 1 greater than" before and after its
 * heading — the brackets are ornament, not content, and there are two of these
 * on every page.
 */
export function CodeTag({ name, closing = false }: CodeTagProps) {
  return (
    <Text variant="tag" aria-hidden="true">
      {`<${closing ? "/" : ""}${name}>`}
    </Text>
  );
}
