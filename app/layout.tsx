import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design Library · heyfreiheit",
  description: "Deine Designreferenzen, visuelle Sprachen und Briefings an einem Ort.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
