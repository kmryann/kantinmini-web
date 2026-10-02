import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kantin Mini — Pesan & POS Terintegrasi",
  description: "Sistem pemesanan meja dan kasir POS terintegrasi untuk Kantin Mini.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#119977",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body
        className={`${plusJakartaSans.className} bg-canvas text-ink min-h-screen selection:bg-brand-muted selection:text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
