import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kantin Mini — Pesan & POS Terintegrasi",
  description: "Sistem pemesanan meja dan kasir POS terintegrasi untuk Kantin Mini.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FBF9F5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-canvas text-ink min-h-screen selection:bg-brand-muted selection:text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
