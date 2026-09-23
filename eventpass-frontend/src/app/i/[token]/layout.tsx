import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're Invited — Ikram Halane & Nebil Yusuf",
  description:
    "Open your personalized wedding invitation and QR wedding pass. October 18, 2026 at Woodbine Banquet Hall.",
  openGraph: {
    title: "You're Invited — Ikram Halane & Nebil Yusuf",
    description:
      "Open your personalized wedding invitation and QR wedding pass. October 18, 2026 at Woodbine Banquet Hall.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "You're Invited — Ikram Halane & Nebil Yusuf",
    description:
      "Open your personalized wedding invitation and QR wedding pass.",
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
