import { redirect } from "next/navigation";

export default function OldInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Redirect old /invite/[token] to new /i/[token]
  params.then(({ token }) => {
    redirect(`/i/${token}`);
  });
}
