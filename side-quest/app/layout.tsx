import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SideQuest",
  description: "Main Character Mode micro-adventures",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#05070f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="bg-layer" aria-hidden="true"></div>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
