import { Ticket } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary">
          <Ticket className="size-5 text-primary-fg" />
        </div>
        <span className="text-lg font-semibold text-fg">EventPass</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
