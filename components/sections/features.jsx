import { Gift, Sparkles, Truck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function Features({ t }) {
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
