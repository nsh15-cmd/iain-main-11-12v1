import { ReactNode } from "react";
import type { Metadata } from "next";
// Removed: import { ClerkProvider } from "@clerk/nextjs"; 
import { Inter } from "next/font/google";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IAIN",
  description: "Video calling App",
  icons: {
    icon: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    // Removed <ClerkProvider> wrapper and its appearance prop configuration
    <html lang="en">
      <body className={`${inter.className} bg-dark-2`}>
        <Toaster />
        {children}
      </body>
    </html>
  );
}