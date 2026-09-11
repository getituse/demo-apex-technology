const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatCardDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatCardDateTime(value: string): string {
  if (value.length === 10) return formatCardDate(value);
  return `${formatCardDate(value)}, ${timeFormatter.format(new Date(value))} UTC`;
}
