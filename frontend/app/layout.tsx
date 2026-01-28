import React from "react"
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const fontGotham = Montserrat({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-gotham',
});

export const metadata: Metadata = {
  title: 'MIMAR Models - Project Timeline',
  description: 'Real-time project timeline management for architectural models',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/mimar-logo.png',
      },
    ],
    apple: '/mimar-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontGotham.variable}>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
