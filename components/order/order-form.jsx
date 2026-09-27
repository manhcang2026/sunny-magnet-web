'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowRight, Truck, CheckCircle2, Phone, MapPin, User, Ticket, Package,
  Mail, Home, Store, Loader2,
} from 'lucide-react'
import { siteContent } from '@/content/site-content'
import DeliveryOption from '@/components/order/delivery-option'
import FormField from '@/components/order/form-field'
import ThankYouScreen from '@/components/order/thank-you-screen'

const { promotion } = siteContent

export default function OrderForm({ t, lang, studioItems, referralFromUrl }) {
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
