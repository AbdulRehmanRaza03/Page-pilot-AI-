import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PagePilot",
  description: "AI-powered Facebook Page communication, lead management, and automation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
