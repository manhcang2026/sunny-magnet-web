import { ArrowRight, Gift } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { siteContent } from '@/content/site-content'

const { commerce, labels, media, promotion } = siteContent
const formattedUnitPrice = `${commerce.unitPrice.toLocaleString('vi-VN')}đ`

export default function Pricing({ t }) {
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
