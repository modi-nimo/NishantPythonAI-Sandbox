import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ganapati Photo Wall 2026",
  description: "Share and celebrate Ganapati festival photos with the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
