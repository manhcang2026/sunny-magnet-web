import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { seo } from '@/content/site-content'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: seo.title,
  description: seo.description,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
