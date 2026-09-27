'use client'

import { motion } from 'framer-motion'
import { Sparkles, Truck, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { siteContent } from '@/content/site-content'

const { labels } = siteContent

export default function HowItWorks({ t }) {
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
