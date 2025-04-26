import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from 'next/font/local'
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const radgivare = localFont({
  src: './radgivare.otf',
  display: 'swap',
  variable: '--font-radgivare',
})

export const metadata: Metadata = {
  title: "Thompson & Hill Barbershop",
  description: "Thompson & Hill Barbershop"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-title" content="Thompson & Hill" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${radgivare.variable} antialiased dark w-screen h-screen`}
      >
        {children}
      </body>
    </html>
  )
}
