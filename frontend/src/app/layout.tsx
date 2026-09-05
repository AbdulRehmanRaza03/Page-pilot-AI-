import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PagePilot — AI-powered Facebook Page automation",
  description:
    "Connect, engage, and grow. One workspace for every Facebook conversation, lead, and automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-navy antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
