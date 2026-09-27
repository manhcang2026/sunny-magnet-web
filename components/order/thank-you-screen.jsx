'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Copy, MessageCircle, PartyPopper, Receipt, Wallet } from 'lucide-react'
import { siteContent } from '@/content/site-content'

const { contact, labels } = siteContent

export default function ThankYouScreen({ t, result, onNew }) {
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
