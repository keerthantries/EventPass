import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <Logo className="size-9" iconClassName="size-5" />
        <span className="text-lg font-semibold text-fg">EventPass</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}