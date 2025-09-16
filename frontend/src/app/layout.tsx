import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";

import "./globals.css";
import { MUIThemeProvider } from "./components/MUIThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import LayoutWrapper from "./components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StockApp - Real-time Stock Dashboard",
  description: "Real-time stock prices with MongoDB Atlas integration",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MUIThemeProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}
