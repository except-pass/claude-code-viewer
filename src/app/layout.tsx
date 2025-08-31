import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryClientProviderWrapper } from "../lib/api/QueryClientProviderWrapper";
import { RootErrorBoundary } from "./components/RootErrorBoundary";
import { ServerEventsProvider } from "./components/ServerEventsProvider";

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
  title: "Claude Code Viewer",
  description: "Web Viewer for Claude Code history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootErrorBoundary>
          <QueryClientProviderWrapper>
            <ServerEventsProvider>{children}</ServerEventsProvider>
          </QueryClientProviderWrapper>
        </RootErrorBoundary>
      </body>
    </html>
  );
}
