interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Used to fade sections in as they scrolled into view. Every section rendered at
 * opacity 0 until JavaScript ran, so the page opened blank and the first paint was
 * empty. Content is now visible at rest; the wrapper stays so callers need no change.
 */
export function ScrollReveal({ children, className = "" }: Props) {
  return <div className={className}>{children}</div>;
}
