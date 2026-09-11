export function assetUrl(src: string): string {
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  return `${base}${src}`;
}
