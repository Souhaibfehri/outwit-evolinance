import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outwit Budget - Take Control of Your Financial Future",
  description: "Privacy-first budgeting that empowers you with zero-based budgeting, smart debt payoff strategies, and comprehensive financial tracking - all in one beautiful app.",
  keywords: ["budgeting", "finance", "zero-based budget", "debt payoff", "financial planning", "privacy-first"],
  authors: [{ name: "Outwit Budget Team" }],
  creator: "Outwit Budget",
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.svg?v=2',
  },
  openGraph: {
    title: "Outwit Budget - Take Control of Your Financial Future",
    description: "Privacy-first budgeting that empowers you with zero-based budgeting, smart debt payoff strategies, and comprehensive financial tracking.",
    url: "https://outwitbudget.com",
    siteName: "Outwit Budget",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Outwit Budget - Personal Finance Management"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Outwit Budget - Take Control of Your Financial Future",
    description: "Privacy-first budgeting with zero-based budgeting, smart debt payoff, and comprehensive tracking.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
