/**
 * Renders Schema.org JSON-LD. `<` is escaped so that a value can never close
 * the script element early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | readonly unknown[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
