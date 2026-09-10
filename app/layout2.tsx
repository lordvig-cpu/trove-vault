import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UIPreferencesProvider } from '@/context/UIPreferencesContext2';

/* ==========================================================================
   1. GLOBAL FONT OPTIMIZATIONS (Next.js Geist Typography)
   Injects font definition CSS variables onto the root document canvas.
   ========================================================================== */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ==========================================================================
   2. APPLICATION METADATA & SEO
   ========================================================================== */
export const metadata: Metadata = {
  title: "TroveVault",
  description: "Collect. Curate. Connect.",
};

/* ==========================================================================
   3. ROOT LAYOUT SHELL
   Supplies root HTML structures, initial dark theme targeting, global font
   classes, and top-level preference context providers.
   ========================================================================== */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="theme-default-dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Top-level provider orchestrating localStorage preferences, themes & docking */}
        <UIPreferencesProvider>
          {children}
        </UIPreferencesProvider>
      </body>
    </html>
  );
}