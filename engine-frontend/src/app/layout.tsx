import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Non-Ideal Reactor Dynamics Engine",
  description: "1D Advection-Dispersion-Reaction Boundary Value Problem Solver",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'Jost, Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
