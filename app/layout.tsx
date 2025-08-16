import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Playfair_Display } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { SupportWidget } from "@/components/support/support-widget"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "SkyBooker - Flight Booking Made Easy",
  description: "Find and book the best flights at the best prices. Your journey starts here.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${playfairDisplay.variable} antialiased`}>
      <body>
        <AuthProvider>
          {children}
          <SupportWidget />
        </AuthProvider>
      </body>
    </html>
  )
}
