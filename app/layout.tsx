import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Trail",
  description: "Image trail demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
