import type { Metadata } from "next";
import { Sarabun, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "DSS Simulations — ระบบสนับสนุนการตัดสินใจ",
  description:
    "สื่อจำลองเชิงโต้ตอบประกอบการเรียนรายวิชาระบบสนับสนุนการตัดสินใจ (Decision Support Systems)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${sarabun.variable} ${mono.variable}`}>
      <body>
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}
