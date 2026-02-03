import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ForayPay - One Tap. One Ticket.',
  description: 'Digital transport ticketing and revenue-control platform for Sierra Leone',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

