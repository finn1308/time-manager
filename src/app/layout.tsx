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
  title: "ChronoMind — Hệ điều hành Quản lý Thời gian & Lịch học Thông minh",
  description:
    "Hệ thống quản lý thời gian và lịch học phong cách Notion: tích hợp Picture-in-Picture Floating Study Timer, thuật toán AI lập lịch học tự động né lịch bận, và phân tích Planned vs Actual.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fbfbfa] dark:bg-[#191919]">{children}</body>
    </html>
  );
}
