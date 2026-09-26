import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR on Image — Pemindai Multi QR",
  description: "Temukan dan ekstrak semua kode QR dari satu gambar melalui URL atau unggahan.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
