export function dateTimestamp(value: string): number {
  const timestamp = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (
    !Number.isFinite(timestamp) ||
    new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !== value.slice(0, 10)
  )
    throw new Error(`Invalid collection date: ${value}`);
  return timestamp;
}

export function newestNews<T extends { publishedAt: string; slug: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      dateTimestamp(b.publishedAt) - dateTimestamp(a.publishedAt) || a.slug.localeCompare(b.slug),
  );
}

export function splitEvents<T extends { startsAt: string; endsAt?: string; slug: string }>(
  items: readonly T[],
  asOf: string,
): { upcoming: T[]; past: T[] } {
  const now = dateTimestamp(asOf);
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const event of items) {
    const end = event.endsAt ?? event.startsAt;
    // Date-only events remain current through the end of their stated UTC calendar day.
    const boundary = dateTimestamp(end) + (end.length === 10 ? 86400000 : 0);
    (boundary < now || (end.length === 10 && boundary === now) ? past : upcoming).push(event);
  }
  upcoming.sort(
    (a, b) => dateTimestamp(a.startsAt) - dateTimestamp(b.startsAt) || a.slug.localeCompare(b.slug),
  );
  past.sort(
    (a, b) => dateTimestamp(b.startsAt) - dateTimestamp(a.startsAt) || a.slug.localeCompare(b.slug),
  );
  return { upcoming, past };
}
