import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "SeeDream",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    "AI Image Generation Platform - Create stunning AI-generated images with advanced project management",
  icons: {
    icon: "/favicon.ico",
  },
  keywords: ["AI", "Image Generation", "Project Management", "Creative Tools"],
  authors: [{ name: "SeeDream Team" }],
  openGraph: {
    title: process.env.NEXT_PUBLIC_APP_NAME || "SeeDream",
    description: "AI Image Generation Platform",
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
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
