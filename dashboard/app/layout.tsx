import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RangerNet — Wildlife Conservation Command",
  description: "Real-time poaching alerts and community conservation network for Kaduna State",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
