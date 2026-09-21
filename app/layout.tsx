import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melimotors | Automotora",
  description: "Vehículos revisados, información clara y acompañamiento real para comprar con tranquilidad.",
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
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
