/**
 * Serialise a JSON-LD object for a <script type="application/ld+json"> tag.
 * JSON.stringify alone does not escape `<`, so firm-controlled text such as
 * "</script><script>…" would break out of the tag (stored XSS). Escaping
 * `<`, `>`, `&` and the JS line separators keeps the JSON valid and inert.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
