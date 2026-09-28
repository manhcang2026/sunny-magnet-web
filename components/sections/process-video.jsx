'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Image, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { siteContent } from '@/content/site-content'

const { media } = siteContent
const stepIcons = [Image, Layers, CheckCircle2]

function ProcessIntro({ t }) {
  return (
    <>
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none rounded-full">
        {t.process.badge}
      </Badge>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{t.process.title}</h2>
      <p className="mt-3 text-neutral-600">{t.process.subtitle}</p>
    </>
  )
}

function ProcessVideoCard() {
  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-xl shadow-orange-100">
      <video
        src={media.processVideo.src}
        poster={media.processVideo.poster}
        playsInline
        controls
        preload="metadata"
        className="aspect-[9/16] w-full object-cover"
      />
    </div>
  )
}

function ProcessSteps({ t }) {
  return (
    <div className="space-y-3">
      {t.process.steps.map((step, index) => {
        const Icon = stepIcons[index]

        return (
          <div key={step.title} className="flex gap-3 rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
            <span className="pt-0.5 text-sm font-extrabold text-orange-500">0{index + 1}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProcessVideo({ t }) {
  return (
    <section id="process" className="relative bg-gradient-to-b from-amber-50/60 to-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="space-y-8 md:hidden">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
          >
            <ProcessIntro t={t} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <ProcessVideoCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ProcessSteps t={t} />
          </motion.div>
        </div>

        <div className="hidden items-center gap-12 md:grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4 }}
          >
            <ProcessVideoCard />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <ProcessIntro t={t} />
            <div className="mt-8">
              <ProcessSteps t={t} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
