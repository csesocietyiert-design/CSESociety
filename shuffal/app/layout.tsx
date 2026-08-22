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
  title: "CSE Society Portal",
  description: "CSE Society Management System",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950">{children}</body>
      <script
        dangerouslySetInnerHTML={{
          __html: "try { var theme = localStorage.getItem('cse-theme'); var isLight = theme === 'light' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches); document.documentElement.dataset.theme = isLight ? 'light' : 'dark'; } catch (error) {}",
        }}
      />
    </html>
  );
}
