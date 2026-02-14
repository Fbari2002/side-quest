import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SideQuest",
  description: "Main Character Mode micro-adventures",
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
