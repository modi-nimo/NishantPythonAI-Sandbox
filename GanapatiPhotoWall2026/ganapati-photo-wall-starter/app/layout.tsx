import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sensorium Cha Vighnaharta",
  description:
    "A shared Ganapati celebration memory wall for Sensorium residents.",
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
