import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

const towerName = process.env.NEXT_PUBLIC_TOWER_NAME || "Tower Pulse";

export const metadata: Metadata = {
  title: `Tower Pulse | ${towerName}`,
  description: `Official residence management & communication portal for ${towerName}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans min-h-screen">
        {/* Background Decorative Blur */}
        <div className="premium-blur" aria-hidden="true" />

        <Sidebar />
        <MobileNav />

        <main className="lg:pl-64 min-h-screen flex flex-col pt-4 pb-20 lg:pt-0">
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
