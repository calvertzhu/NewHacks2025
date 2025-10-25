import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Hackathon App',
  description: 'A full-stack web application built with FastAPI, Next.js, and MongoDB.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}