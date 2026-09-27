'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowRight, Truck, CheckCircle2, Phone, MapPin, User, Ticket, Package,
  Mail, Home, Store, PartyPopper, Copy, MessageCircle, Loader2, Receipt, Wallet
} from 'lucide-react'
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

const { contact, promotion, translations } = siteContent

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
