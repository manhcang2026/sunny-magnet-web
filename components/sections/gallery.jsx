'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { siteContent } from '@/content/site-content'

const { labels, media } = siteContent

export default function Gallery({ t }) {
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
