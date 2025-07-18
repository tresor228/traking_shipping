// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";
import { RoleProvider } from "@/context/RoleContext";

export const metadata: Metadata = {
  title: "Mon Application Next.js",
  description: "Une application moderne avec Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <RoleProvider>
            {children}
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}