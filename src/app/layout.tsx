"use client";

import { HeroUIProvider } from "@heroui/react";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <HeroUIProvider>{children}</HeroUIProvider>
      </body>
    </html>
  );
}
