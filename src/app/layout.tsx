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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-white min-h-screen w-full overflow-x-hidden`}
      >
        <div className="flex flex-col min-h-screen w-full max-w-[100vw] items-center justify-between py-4 sm:py-6 px-4 sm:px-8">
          <div className="h-5" /> {/* Top spacer */}
          <main className="w-full flex-1 flex items-center justify-center">
            {children}
          </main>
          <div className="h-5" /> {/* Bottom spacer */}
        </div>
      </body>
    </html>
  );
}
