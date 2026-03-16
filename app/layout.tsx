import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BKK Terminal — Bangkok Property Intelligence",
  description: "Real-time Bangkok property market data aggregated from DDProperty, FazWaz, Hipflat, and Dot Property.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
