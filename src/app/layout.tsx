import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reserva de Salones",
  description: "Sistema con diseño original adaptado a Tailwind 4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen transition-colors duration-500`}
      >
        {/* Barra superior con switch de tema */}
        <header className="flex justify-end items-center p-4 border-b border-border bg-[var(--card)]">
          <ThemeToggle />
        </header>

        {/* Contenido principal */}
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
