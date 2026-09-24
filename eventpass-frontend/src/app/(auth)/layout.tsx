import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-y-auto bg-bg">
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:py-12">
        <div className="mb-6 flex w-full max-w-sm flex-col items-center text-center sm:mb-8">
          <div className="relative mb-3 sm:mb-4">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-2xl" aria-hidden />
            <Logo className="size-14 text-primary sm:size-16" />
          </div>
          <span className="text-xl font-bold tracking-tight text-fg sm:text-2xl">EventPass</span>
          <span className="mt-1 max-w-xs text-sm text-fg-secondary">
            Invitations, RSVP &amp; QR check-in for every event
          </span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
