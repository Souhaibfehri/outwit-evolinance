import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Outwit Budget - Take Control of Your Financial Future',
    template: '%s | Outwit Budget'
  },
  description: 'Privacy-first personal finance with zero-based budgeting, smart debt payoff strategies, and comprehensive goal tracking. Start your 7-day free trial today.',
  keywords: ['budgeting', 'personal finance', 'debt payoff', 'zero-based budget', 'financial goals', 'YNAB alternative'],
  authors: [{ name: 'Outwit Budget Team' }],
  creator: 'Outwit Budget',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://outwitbudget.com',
    title: 'Outwit Budget - Take Control of Your Financial Future',
    description: 'Privacy-first personal finance with zero-based budgeting, smart debt payoff strategies, and comprehensive goal tracking.',
    siteName: 'Outwit Budget',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Outwit Budget - Personal Finance Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outwit Budget - Take Control of Your Financial Future',
    description: 'Privacy-first personal finance with zero-based budgeting, smart debt payoff strategies, and comprehensive goal tracking.',
    images: ['/og-image.png'],
    creator: '@outwitbudget',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
