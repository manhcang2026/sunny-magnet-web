'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Sun, ArrowRight, Upload, Sparkles, Truck, ShieldCheck, Gift, Star,
  CheckCircle2, Phone, MapPin, User, Ticket, Package, Languages,
  Mail, Home, Store, PartyPopper, Copy, MessageCircle, Loader2, Receipt, Wallet
} from 'lucide-react'
import { siteContent } from '@/content/site-content'
import MagnetStudio from '@/components/magnet-studio'

const { brand, contact, commerce, labels, media, promotion, translations } = siteContent
const formattedUnitPrice = `${commerce.unitPrice.toLocaleString('vi-VN')}đ`

function Nav({ lang, setLang, t }) {
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
            <a href="#order">{t.nav.order}</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero({ t }) {
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

function Features({ t }) {
  const icons = [Sparkles, Truck, Gift]
  return (
    <section className="container mx-auto px-4 py-14 md:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t.features.title}</h2>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {t.features.items.map((f, i) => {
          const Icon = icons[i] || Sparkles
          return (
            <Card key={i} className="border-amber-100 hover:shadow-lg hover:-translate-y-0.5 transition rounded-2xl">
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-white shadow">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-bold">{f.title}</div>
                <p className="mt-1 text-neutral-600 text-sm leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function Gallery({ t }) {
  return (
    <section id="gallery" className="relative py-14 md:py-20 bg-gradient-to-b from-amber-50/60 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none rounded-full">{labels.gallery}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">{t.gallery.title}</h2>
          <p className="mt-3 text-neutral-600">{t.gallery.subtitle}</p>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {media.gallery.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative rounded-2xl overflow-hidden shadow-md group aspect-[4/5]"
            >
              <img src={g.url} alt={g.label} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 text-white text-sm font-medium drop-shadow">{g.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing({ t }) {
  return (
    <section id="pricing" className="container mx-auto px-4 py-14 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="relative">
          <div className="relative aspect-square max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl ring-1 ring-amber-200">
            <img
              src={media.pricingImage.url}
              alt={media.pricingImage.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-500/30" />
          </div>
          {promotion.enabled && (
            <div className="absolute -top-4 -left-2 md:top-4 md:-left-6 bg-white rounded-2xl shadow-xl p-4 border border-amber-100 float-slow">
              <div className="text-2xl md:text-3xl font-extrabold text-neutral-900">{promotion.title}</div>
              <div className="text-sm text-neutral-600 mt-1 max-w-[220px]">{promotion.description}</div>
            </div>
          )}
        </div>
        <div>
          <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-none rounded-full">{labels.pricing}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">{t.pricing.title}</h2>
          <p className="mt-2 text-neutral-600">{t.pricing.subtitle}</p>
          {promotion.enabled && (
            <div className="mt-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-orange-900">{promotion.title}</div>
                <div className="text-sm text-orange-800/80">{promotion.description}</div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {t.pricing.tiers.map((tier, i) => (
              <div key={i}
                className={`relative rounded-2xl border p-4 md:p-5 flex items-center justify-between transition
                  ${tier.highlight ? 'border-orange-400 bg-gradient-to-r from-amber-50 to-orange-50 shadow-md' : 'border-amber-100 bg-white hover:border-amber-200'}`}>
                <div>
                  <div className="font-bold text-lg">{tier.name}</div>
                  <div className="text-sm text-neutral-600">{tier.qty}</div>
                  <div className="text-xs mt-1 text-orange-700 font-medium">{tier.perk}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-neutral-900">{formattedUnitPrice}</div>
                  <div className="text-xs text-neutral-500">{t.pricing.unit}</div>
                </div>
                {tier.highlight && (
                  <span className="absolute -top-2 right-4 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">{labels.popular}</span>
                )}
              </div>
            ))}
          </div>

          <Button asChild size="lg" className="mt-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 h-12 px-8 shadow-lg shadow-orange-200">
            <a href="#order">{t.pricing.cta} <ArrowRight className="ml-1 h-4 w-4" /></a>
          </Button>
        </div>
      </div>
    </section>
  )
}

function HowItWorks({ t }) {
  const icons = [Upload, Sparkles, Truck]
  return (
    <section id="how" className="relative py-14 md:py-20 bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none rounded-full">{labels.howSteps}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">{t.how.title}</h2>
          <p className="mt-2 text-neutral-600">{t.how.subtitle}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = icons[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="relative border-amber-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-5xl font-extrabold text-amber-200 leading-none">0{i+1}</div>
                    </div>
                    <div className="mt-4 text-lg font-bold">{s.title}</div>
                    <p className="mt-1 text-neutral-600 text-sm leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function OrderForm({ t, lang, studioItems, referralFromUrl }) {
  const [form, setForm] = useState({
    fullName: '', phone: '', address: '', email: '',
    delivery: '', referralCode: '', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [encoding, setEncoding] = useState(false)
  const [orderResult, setOrderResult] = useState(null)

  const configuredItems = (studioItems || []).filter((i) => i.adjust?.configured)
  const configuredCount = configuredItems.length

  useEffect(() => {
    if (referralFromUrl) setForm((f) => (f.referralCode ? f : { ...f, referralCode: referralFromUrl }))
  }, [referralFromUrl])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim() || !form.delivery) {
      toast.error(t.form.required); return
    }
    if (configuredCount < 1) {
      toast.error(t.form.needMagnets); return
    }
    setLoading(true); setEncoding(true)
    try {
      // Encode all configured magnets to base64 (827x827 JPEGs from the studio)
      const magnets = await Promise.all(configuredItems.map(async (it, idx) => {
        let dataUrl = null
        if (it.outputBlob) dataUrl = await blobToBase64(it.outputBlob)
        return {
          index: idx + 1,
          name: it.name || `magnet-${idx + 1}.jpg`,
          dataUrl,
        }
      }))
      setEncoding(false)

      const payload = {
        ...form,
        language: lang,
        totalMagnets: configuredCount,
        magnets,
      }

      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL
      let data
      if (gasUrl && gasUrl.startsWith('http')) {
        const res = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        })
        data = await res.json()
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, language: lang, quantity: configuredCount }),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed')
      }

      // Normalize response fields for the Thank You screen
      const orderId = data.orderId || data.order?.id || data.lead?.id || `SM-${Date.now().toString(36).toUpperCase()}`
      const totalPrice = data.totalPrice || data.total || null
      const vietQrUrl = data.vietQrUrl || data.qrUrl || null
      const message = data.message || t.form.success

      setOrderResult({
        orderId,
        totalPrice,
        vietQrUrl,
        message,
        magnetsCount: configuredCount,
      })
      toast.success(t.form.success)

      // Scroll to top of order section for the Thank You screen
      const el = document.getElementById('order')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      console.error(err)
      toast.error(t.form.error)
    } finally {
      setLoading(false); setEncoding(false)
    }
  }

  const resetForOrder = () => {
    setOrderResult(null)
    setForm({ fullName: '', phone: '', address: '', email: '', delivery: '', referralCode: referralFromUrl || '', notes: '' })
  }

  if (orderResult) {
    return <ThankYouScreen t={t} result={orderResult} onNew={resetForOrder} />
  }

  return (
    <section id="order" className="relative py-14 md:py-24 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400">
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4), transparent 45%)' }} />
      <div className="container mx-auto px-4 relative">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="text-white md:sticky md:top-24">
            {promotion.enabled && (
              <Badge className="bg-white/25 text-white border-white/40 hover:bg-white/25 rounded-full backdrop-blur">
                ☀️ {promotion.title}
              </Badge>
            )}
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {t.form.title}
            </h2>
            <p className="mt-3 text-white/90 max-w-md">{t.form.subtitle}</p>
            <div className="mt-6 space-y-2 text-white/90 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {t.hero.stat3}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {t.features.items[2].title}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> {t.features.items[0].title}</div>
            </div>
          </div>

          <Card className="rounded-3xl shadow-2xl border-none">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField icon={User} label={t.form.name} required>
                    <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder={t.form.namePh} className="h-11" />
                  </FormField>
                  <FormField icon={Phone} label={t.form.phone} required>
                    <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder={t.form.phonePh} className="h-11" inputMode="tel" />
                  </FormField>
                </div>
                <FormField icon={MapPin} label={t.form.address} required>
                  <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder={t.form.addressPh} className="h-11" />
                </FormField>
                <FormField icon={Mail} label={t.form.email}>
                  <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder={t.form.emailPh} className="h-11" type="email" />
                </FormField>

                {/* Delivery method radio group */}
                <div>
                  <Label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5 mb-1.5">
                    <Truck className="h-3.5 w-3.5 text-orange-500" />
                    {t.form.delivery}<span className="text-orange-500">*</span>
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <DeliveryOption
                      icon={Home}
                      label={t.form.deliveryHome}
                      checked={form.delivery === 'home'}
                      onChange={() => update('delivery', 'home')}
                    />
                    <DeliveryOption
                      icon={Store}
                      label={t.form.deliveryPickup}
                      checked={form.delivery === 'pickup'}
                      onChange={() => update('delivery', 'pickup')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField icon={Package} label={t.form.quantity}>
                    <div className="relative">
                      <Input
                        value={configuredCount}
                        readOnly
                        className="h-11 bg-amber-50 text-neutral-900 font-bold cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-amber-700 font-semibold pointer-events-none">
                        {t.form.quantityHint}
                      </span>
                    </div>
                  </FormField>
                  <FormField icon={Ticket} label={t.form.referral}>
                    <Input value={form.referralCode} onChange={e => update('referralCode', e.target.value)} placeholder={t.form.referralPh} className="h-11" />
                  </FormField>
                </div>
                <FormField label={t.form.notes}>
                  <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder={t.form.notesPh} rows={3} />
                </FormField>

                <Button type="submit" disabled={loading} size="lg"
                  className="w-full h-12 rounded-full text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200">
                  {loading
                    ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {encoding ? '…' : ''}{t.form.sending}</>)
                    : (<>{t.form.submit} <ArrowRight className="ml-2 h-4 w-4" /></>)}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function DeliveryOption({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${checked ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 bg-white hover:border-amber-300'}`}
    >
      <span className={`h-9 w-9 rounded-lg grid place-items-center ${checked ? 'bg-orange-500 text-white' : 'bg-amber-100 text-orange-600'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className={`text-sm font-semibold leading-tight ${checked ? 'text-orange-900' : 'text-neutral-700'}`}>
        {label}
      </span>
      <span className={`absolute top-2 right-2 h-4 w-4 rounded-full border-2 ${checked ? 'border-orange-500 bg-orange-500' : 'border-neutral-300 bg-white'}`}>
        {checked && <CheckCircle2 className="h-3 w-3 text-white -m-0.5" />}
      </span>
    </button>
  )
}

function ThankYouScreen({ t, result, onNew }) {
  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || contact.supportUrl
  const [copied, setCopied] = useState(false)

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(result.orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  return (
    <section id="order" className="relative py-16 md:py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 overflow-hidden">
      {/* confetti-like radial */}
      <div className="absolute inset-0 pointer-events-none opacity-70"
        style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(255,193,7,0.35), transparent 70%), radial-gradient(40% 30% at 80% 90%, rgba(255,138,0,0.25), transparent 60%)' }} />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 grid place-items-center shadow-xl shadow-orange-200">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
              {t.thankYou.title}
            </h2>
            <p className="mt-2 text-neutral-600 text-lg">{t.thankYou.subtitle}</p>
          </div>

          <Card className="mt-8 rounded-3xl shadow-2xl border-none overflow-hidden">
            <CardContent className="p-0">
              {/* Order info stripe */}
              <div className="grid sm:grid-cols-2 gap-px bg-amber-100">
                <div className="p-5 bg-white">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    <Receipt className="h-3.5 w-3.5" /> {t.thankYou.orderIdLabel}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xl md:text-2xl text-neutral-900 break-all">{result.orderId}</span>
                    <button
                      onClick={copyOrderId}
                      className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold whitespace-nowrap"
                    >
                      {copied ? (<><CheckCircle2 className="h-3.5 w-3.5" /> {t.thankYou.copied}</>) : (<><Copy className="h-3.5 w-3.5" /> {t.thankYou.copyOrderId}</>)}
                    </button>
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    <Wallet className="h-3.5 w-3.5" /> {t.thankYou.totalLabel}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
                      {result.totalPrice || '—'}
                    </span>
                    {result.magnetsCount > 0 && (
                      <span className="text-xs text-neutral-500">
                        · {result.magnetsCount} {t.thankYou.magnetsLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* QR block */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-center text-sm font-semibold text-orange-900">
                  {t.thankYou.qrLabel}
                </div>
                <div className="mt-4 mx-auto w-56 h-56 sm:w-64 sm:h-64 rounded-2xl bg-white shadow-lg border border-amber-200 p-3 grid place-items-center">
                  {result.vietQrUrl ? (
                    <img
                      src={result.vietQrUrl}
                      alt={labels.vietQrAlt}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-neutral-400 text-xs px-4">
                      {labels.vietQrFallback}
                    </div>
                  )}
                </div>
              </div>

              {/* Zalo CTA */}
              <div className="p-6 md:p-7 bg-white space-y-3">
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-14 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-base font-bold shadow-lg shadow-blue-200 transition"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t.thankYou.zaloBtn}
                </a>
                <Button
                  onClick={onNew}
                  variant="outline"
                  className="w-full rounded-full h-11"
                >
                  + {t.thankYou.newOrder}
                </Button>
                <p className="text-[11px] text-neutral-500 text-center leading-relaxed pt-1">
                  {t.thankYou.note}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function FormField({ icon: Icon, label, children, required }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-orange-500" />}
        {label}{required && <span className="text-orange-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Footer({ t }) {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-white text-lg">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white">
                <Sun className="h-5 w-5" />
              </span>
              {brand.nameFirst} <span className="text-orange-400">{brand.nameHighlight}</span>
            </div>
            <p className="mt-3 text-sm text-neutral-400 max-w-xs">{t.footer.tagline}</p>
          </div>
          <div>
            <div className="text-white font-semibold">{t.footer.contact}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-400" /> {contact.phone}</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" /> {contact.address}</li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold">{brand.name}</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-400">
              <li><a href="#how" className="hover:text-orange-300">{t.nav.how}</a></li>
              <li><a href="#gallery" className="hover:text-orange-300">{t.nav.gallery}</a></li>
              <li><a href="#pricing" className="hover:text-orange-300">{t.nav.pricing}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} {brand.name}. {t.footer.rights}</div>
          <div>{labels.footerMadeIn}</div>
        </div>
      </div>
    </footer>
  )
}

function StickyMobileCTA({ t }) {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      <Button asChild size="lg" className="w-full h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-300/50">
        <a href="#order">{t.nav.order} <ArrowRight className="ml-1 h-4 w-4" /></a>
      </Button>
    </div>
  )
}

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
