import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
}

/**
 * EventPass brand logo — a custom entry-pass mark (ticket/pass silhouette
 * with a check-in check) rendered as inline SVG with no background tile.
 */
export function Logo({ className, iconClassName }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-primary", className ?? "size-9", iconClassName)}
      aria-hidden
    >
      {/* ticket / entry-pass body */}
      <path
        d="M4 8.5c1.3 0 1.7 1 1.7 1.9 0 .9.8 1.6 1.8 1.6s1.8-.7 1.8-1.6c0-.9.4-1.9 1.7-1.9s1.7 1 1.7 1.9c0 .9.8 1.6 1.8 1.6s1.8-.7 1.8-1.6c0-.9.4-1.9 1.7-1.9V17c-1.3 0-1.7-1-1.7-1.9 0-.9-.8-1.6-1.8-1.6s-1.8.7-1.8 1.6c0 .9-.4 1.9-1.7 1.9s-1.7-1-1.7-1.9c0-.9-.8-1.6-1.8-1.6s-1.8.7-1.8 1.6C5.7 16 5.3 17 4 17V8.5Z"
        fill="currentColor"
      />
      {/* vertical ticket perforation */}
      <path d="M12 8.5v8" stroke="var(--color-bg)" strokeWidth="1.1" strokeDasharray="1.6 1.4" strokeLinecap="round" />
      {/* check-in check */}
      <path
        d="M8.9 11.9l2 2.1 4.2-4.6"
        stroke="var(--color-bg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}