'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Gift, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { siteContent } from '@/content/site-content'

const { labels, media } = siteContent

export default function Hero({ t }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % media.heroSlides.length), 4200)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="top" className="relative overflow-hidden bg-radial-sun">
      <div className="absolute inset-0 pointer-events-none opacity-70"
           style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(255,193,7,0.35), transparent 70%)' }} />
      <div className="container mx-auto px-4 pt-10 pb-16 md:pt-20 md:pb-28">
        <div className="grid gap-10 md:gap-12 md:grid-cols-2 items-center">
          <div className="relative z-10">
            <div>
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
                {t.hero.badge}
              </Badge>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
                {t.hero.title}{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                    {t.hero.titleHighlight}
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 opacity-70" />
                </span>
              </h1>
              <p className="mt-5 text-lg md:text-xl text-neutral-600 max-w-xl text-balance">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-8 h-12 text-base shadow-lg shadow-orange-200">
                  <a href="#order" className="flex items-center gap-2">
                    {t.hero.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-amber-300 bg-white hover:bg-amber-50 h-12 px-6">
                  <a href="#how">{t.hero.ctaSecondary}</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-500" />{t.hero.stat1}</span>
                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500 fill-amber-500" />{t.hero.stat2}</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-orange-500" />{t.hero.stat3}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] md:aspect-[5/6] w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-orange-200 ring-1 ring-amber-200">
              {media.heroSlides.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={media.heroAlt}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {media.heroSlides.map((_, i) => (
                    <span key={i}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} />
                  ))}
                </div>
                <Badge className="bg-white/95 text-amber-900 hover:bg-white border-none shadow">
                  <Sparkles className="mr-1 h-3 w-3" /> {labels.heroPrint}
                </Badge>
              </div>
            </div>
            {/* Floating chips */}
            <motion.div
              className="hidden md:block absolute -left-6 top-10 rounded-2xl bg-white shadow-lg p-3 float-slow"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{labels.heroGiftTitle}</div>
                  <div className="text-sm font-semibold">{labels.heroGiftSubtitle}</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="hidden md:block absolute -right-4 bottom-8 rounded-2xl bg-white shadow-lg p-3 float-slow"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{labels.heroWarrantyTitle}</div>
                  <div className="text-sm font-semibold">{labels.heroWarrantySubtitle}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
