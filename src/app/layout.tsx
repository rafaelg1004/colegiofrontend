import type { Metadata } from "next";
import "./globals.css";
import ApiDebug from "@/components/debug/ApiDebug";
import ChunkErrorListener from "@/components/common/ChunkErrorListener";

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
        <ChunkErrorListener />
        {children}
        <ApiDebug />
      </body>
    </html>
  );
}
