import type { Metadata } from 'next'
import { JetBrains_Mono, Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import CommandPalette from '@/components/CommandPalette'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sherlock - AI Incident Response Co-pilot',
  description: 'From alert to fix PR in 5 minutes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans min-h-screen bg-background text-foreground selection:bg-primary/30 antialiased transition-colors duration-200">
        <Providers>
          {children}
          <CommandPalette />
          <Toaster theme="dark" position="bottom-right" className="font-sans" />
        </Providers>
      </body>
    </html>
  )
}
