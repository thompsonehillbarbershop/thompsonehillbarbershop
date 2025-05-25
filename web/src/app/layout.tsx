import type { Metadata } from "next"
import { Geist, Geist_Mono, Spectral } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import QueryContext from "@/contexts/query-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} antialiased dark w-screen h-screen`}
      >
        <QueryContext>
          {children}
          <Toaster />
        </QueryContext>
      </body>
    </html>
  )
}
