export function SkipToContent({ label = "Skip to content" }: { label?: string }) {
  return (
    <a
      href="#main"
      className="sr-only z-[60] focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-[3px] focus:ring-ring"
    >
      {label}
    </a>
  );
}
