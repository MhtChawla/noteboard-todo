import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noteboard",
  description: "A minimal Notion-like task board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
