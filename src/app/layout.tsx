import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Our Story '26",
  description: "A beautiful gallery of our sweetest moments and cherished memories together.",
  icons: {
    icon: "/stamp.png",
    shortcut: "/stamp.png",
    apple: "/stamp.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/Ourstory26.jpg" as="image" />
      </head>
      <body 
        className="min-h-full flex flex-col bg-black text-white selection:bg-rose-500 selection:text-white"
        suppressHydrationWarning
      >
        {/* Background Heart Animation */}
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "url('/bg hearts/Butterfly hearts.gif')",
            backgroundRepeat: "repeat",
            backgroundSize: "500px",
            opacity: 0.14,
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
