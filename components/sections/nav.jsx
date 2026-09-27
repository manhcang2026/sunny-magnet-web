'use client'

import { Button } from '@/components/ui/button'
import { Languages, Sun } from 'lucide-react'
import { siteContent } from '@/content/site-content'

const { brand, labels } = siteContent

export default function Nav({ lang, setLang, t }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-amber-100">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2 font-bold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-md shadow-orange-200">
            <Sun className="h-5 w-5" />
          </span>
          <span className="tracking-tight">{brand.nameFirst} <span className="text-orange-500">{brand.nameHighlight}</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-700">
          <a href="#how" className="hover:text-orange-500 transition">{t.nav.how}</a>
          <a href="#studio" className="hover:text-orange-500 transition">{t.studio.badge}</a>
          <a href="#gallery" className="hover:text-orange-500 transition">{t.nav.gallery}</a>
          <a href="#pricing" className="hover:text-orange-500 transition">{t.nav.pricing}</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition"
            aria-label={labels.languageToggle}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'en' ? 'VI' : 'EN'}
          </button>
          <Button
            asChild
            className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200"
          >
            <a href="#studio">{t.nav.order}</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
