import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BD Railway Online Ticket Booking",
  description: "Book your ticket online with BD Railway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
