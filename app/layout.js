import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'Sunny Magnet — Custom Photo Magnets | Nam châm ảnh cá nhân hóa',
  description: 'Turn your memories into beautiful custom photo magnets. Buy 10, Get 1 Free. Fast delivery across Vietnam.',
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
