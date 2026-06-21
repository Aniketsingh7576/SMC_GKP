import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = { title: { default: "MedVault | Medical Report Portal", template: "%s | MedVault" }, description: "Secure medical report management and verification.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className="font-sans antialiased"><Toaster richColors position="top-right" />{children}</body></html>; }
