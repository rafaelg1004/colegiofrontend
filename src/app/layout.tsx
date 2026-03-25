import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduGestion - Portal Institucional",
  description: "Sistema Integral de Gestión Académica y Administrativa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
