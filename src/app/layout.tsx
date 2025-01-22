import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quenya",
  description: "Share images securely and temporarily. Your uploads disappear after 24 hours or after first view - your choice.",
  openGraph: {
    title: "Quenya",
    description: "Share images securely and temporarily. Your uploads disappear after 24 hours or after first view - your choice.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quenya",
    description: "Share images securely and temporarily. Your uploads disappear after 24 hours or after first view - your choice.",
  },
  metadataBase: new URL("https://quenya.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white min-h-screen`}
      >
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 sm:p-8 pb-11 sm:pb-15 gap-8 sm:gap-16">
          {children}
        </div>
      </body>
    </html>
  );
}
