import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ereja | Social Multi-Vendor OS",
  description: "A comprehensive Social Multi-Vendor Ecosystem with Infinity Canvas, AI-powered marketplace, and real-time collaboration.",
  keywords: ["Ereja", "Multi-Vendor", "Marketplace", "Social Commerce", "AI Assistant"],
  authors: [{ name: "Ereja Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Ereja | Social Multi-Vendor OS",
    description: "A comprehensive Social Multi-Vendor Ecosystem",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
