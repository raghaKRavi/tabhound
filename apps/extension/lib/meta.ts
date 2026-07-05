export type PageMeta = {
  description: string;
  h1: string;
};

// Kept as an isolated module so v2 can expand into full content extraction
// without touching the messaging or indexing layers.
export function extractMeta(doc: Document): PageMeta {
  const description =
    doc.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ??
    doc.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ??
    '';
  const h1 = doc.querySelector('h1')?.textContent?.trim() ?? '';
  return { description, h1 };
}
