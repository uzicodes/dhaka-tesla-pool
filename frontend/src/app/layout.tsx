import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
  title: "Dhaka Tesla Pool | Shared Electric Mobility",
  description: "Real-time, concurrency-safe Tesla ride pooling for Dhaka commuters.",
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 py-8 px-4 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/favicon/android-chrome-512x512.png" alt="Tesla Pool Logo" className="w-5 h-5 object-cover rounded-sm" />
              <p>&copy; {new Date().getFullYear()} Dhaka Tesla Pool. Zero emissions, shared fares.</p>
            </div>
            <p className="text-slate-400">Banani &bull; Mohakhali &bull; Gulshan &bull; Dhanmondi &bull; Uttara</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
