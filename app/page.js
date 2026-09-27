'use client'

import { useEffect, useMemo, useState } from 'react'
import { siteContent } from '@/content/site-content'
import MagnetStudio from '@/components/magnet-studio'
import Nav from '@/components/sections/nav'
import Hero from '@/components/sections/hero'
import Features from '@/components/sections/features'
import Gallery from '@/components/sections/gallery'
import Pricing from '@/components/sections/pricing'
import HowItWorks from '@/components/sections/how-it-works'
import Footer from '@/components/sections/footer'
import StickyMobileCTA from '@/components/sections/sticky-mobile-cta'
import OrderForm from '@/components/order/order-form'

const { translations } = siteContent

const App = () => {
  const [lang, setLang] = useState('en')
  const [studioItems, setStudioItems] = useState([])
  const [referralFromUrl, setReferralFromUrl] = useState('')
  const t = useMemo(() => translations[lang], [lang])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sunny_lang')
      if (saved && translations[saved]) setLang(saved)
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref') || params.get('referral') || ''
      if (ref) setReferralFromUrl(ref.trim())
    }
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('sunny_lang', lang)
  }, [lang])

  const handleUseThese = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('order')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Nav lang={lang} setLang={setLang} t={t} />
      <Hero t={t} />
      <Features t={t} />
      <Gallery t={t} />
      <Pricing t={t} />
      <HowItWorks t={t} />
      <MagnetStudio t={t} onUseThese={handleUseThese} onItemsChange={setStudioItems} />
      <OrderForm t={t} lang={lang} studioItems={studioItems} referralFromUrl={referralFromUrl} />
      <Footer t={t} />
      <StickyMobileCTA t={t} />
    </main>
  )
}

export default App
