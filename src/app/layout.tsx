import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Nunito } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChronoMind 2.0 — Study OS",
  description:
    "Hệ thống quản lý thời gian học tập thông minh, tích hợp AI lập lịch thích ứng, theo dõi kỹ năng và luyện từ vựng theo phương pháp Spaced Repetition.",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChronoMind",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFAF4" },
    { media: "(prefers-color-scheme: dark)",  color: "#13111A" },
  ],
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${plusJakartaSans.variable} ${nunito.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col overflow-x-hidden"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-ink)",
          fontFamily: "var(--font-jakarta), 'Plus Jakarta Sans', sans-serif",
        }}
      >
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-jakarta)",
              borderRadius: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
