import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Debug Dashboard | Farcaster Mini App",
  description: "Development and troubleshooting dashboard for the Farcaster mini app",
  robots: "noindex, nofollow", // Don't index debug pages
  openGraph: {
    title: "Debug Dashboard",
    description: "Development tools and debugging information",
    type: "website",
  },
};

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
