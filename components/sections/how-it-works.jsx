'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ClipboardList, Crop, Image as ImageIcon, Info, MapPin, QrCode, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

function StepVisual({ index }) {
  if (index === 0) {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-amber-50 md:h-28 md:w-full">
        <div className="absolute left-3 top-3 flex h-11 w-9 -rotate-6 items-center justify-center rounded-lg border border-amber-100 bg-white shadow-sm md:left-8 md:top-5 md:h-16 md:w-14">
          <ImageIcon className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
        </div>
        <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-md md:bottom-5 md:right-8 md:h-10 md:w-10">
          <Upload className="h-4 w-4 md:h-5 md:w-5" />
        </div>
      </div>
    )
  }

  if (index === 1) {
    return (
      <div className="relative h-20 w-20 shrink-0 rounded-xl border border-amber-100 bg-amber-50 p-2 md:h-28 md:w-full md:p-3">
        <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-orange-300 bg-white">
          <ImageIcon className="h-6 w-6 text-amber-400 md:h-8 md:w-8" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow md:bottom-2 md:right-2 md:h-9 md:w-9">
          <Crop className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
      </div>
    )
  }

  if (index === 2) {
    return (
      <div className="relative h-20 w-20 shrink-0 rounded-xl border border-amber-100 bg-amber-50 p-2 md:h-28 md:w-full md:p-3">
        <div className="h-full rounded-lg border border-amber-100 bg-white p-2 shadow-sm md:p-3">
          <div className="flex items-center gap-1.5 text-orange-500">
            <ClipboardList className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <div className="h-1.5 w-8 rounded-full bg-amber-200 md:w-12" />
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-neutral-100" />
          <div className="mt-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-amber-500" />
            <div className="h-1.5 flex-1 rounded-full bg-neutral-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 md:h-28 md:w-full">
      <QrCode className="h-10 w-10 text-neutral-800 md:h-14 md:w-14" />
      <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow md:h-9 md:w-9">
        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
      </div>
    </div>
  )
}

export default function HowItWorks({ t }) {
  return (
    <section id="how" className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="rounded-full border-none bg-orange-100 text-orange-800 hover:bg-orange-100">{t.how.badge}</Badge>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{t.how.title}</h2>
          <p className="mt-2 text-neutral-600">{t.how.subtitle}</p>
        </div>

        <div className="relative mt-10 space-y-4 md:hidden">
          <div className="absolute bottom-6 left-[1.35rem] top-6 border-l-2 border-dashed border-orange-200" aria-hidden="true" />
          {t.how.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3"
            >
              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-white shadow-md shadow-orange-200">
                {index + 1}
              </div>
              <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-sm">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-neutral-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.desc}</p>
                  </div>
                  <StepVisual index={index} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 hidden grid-cols-4 gap-5 md:grid">
          {t.how.steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="relative"
            >
              {index < t.how.steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200 bg-white text-orange-400 shadow-sm" aria-hidden="true">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
              <Card className="h-full rounded-2xl border-amber-100 bg-white/90 shadow-sm transition hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-white shadow-md shadow-orange-200">
                    {index + 1}
                  </div>
                  <div className="mt-4">
                    <StepVisual index={index} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-neutral-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-8 flex max-w-4xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-100/70 px-4 py-3 text-sm leading-relaxed text-amber-950 shadow-sm md:items-center md:px-5"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 md:mt-0" />
          <p>{t.how.note}</p>
        </motion.div>
      </div>
    </section>
  )
}
