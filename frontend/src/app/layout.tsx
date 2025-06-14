import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { GlobalUploadProgress } from '@/components/candidates/GlobalUploadProgress';
import { AppProvider } from '@/contexts/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Matcher",
  description: "AI-powered job matching platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <AppProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
          <GlobalUploadProgress />
        </AppProvider>
      </body>
    </html>
  );
}
