import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstRead — Dynamic Book & Light Novel Tracker",
  description: "Track reading progress, log active sessions, and forecast completion time with dynamic reading speed analytics.",
  applicationName: "AstRead",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f0e0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#0f0e0c] text-amber-50 antialiased selection:bg-amber-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
