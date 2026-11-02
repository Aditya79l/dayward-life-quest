import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Dayward — Your life, in progress", description: "Turn everyday routines into an adventure." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

