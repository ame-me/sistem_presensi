import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Sistem Presensi Sekolah",
  description:
    "Sistem presensi digital untuk manajemen kehadiran siswa, izin, dan komunikasi orang tua-guru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased text-slate-800`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
