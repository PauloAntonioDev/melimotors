import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melimotors | Automotora en Talca | Autos usados",
  description: "Compra autos usados en Talca en Melimotors. Todos nuestros vehículos pasan por una inspección rigurosa y completa, con información clara y financiamiento referencial.",
  keywords: ["automotora en Talca", "autos usados en Talca", "vehículos revisados Talca", "financiamiento automotriz Talca"],
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
