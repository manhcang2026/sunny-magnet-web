'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StickyMobileCTA({ t, configuredCount }) {
  const [isOrderVisible, setIsOrderVisible] = useState(false)
  const hasConfiguredMagnets = configuredCount > 0
  const href = hasConfiguredMagnets ? '#order' : '#studio'
  const label = hasConfiguredMagnets
    ? `${t.stickyCta.continue} • ${configuredCount} ${configuredCount === 1 ? t.stickyCta.unitSingular : t.stickyCta.unitPlural}`
    : t.stickyCta.create

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(([entry]) => {
      setIsOrderVisible(entry.isIntersecting)
    })
    let observedOrderSection

    const observeOrderSection = () => {
      const orderSection = document.getElementById('order')
      if (!orderSection || orderSection === observedOrderSection) return

      observer.disconnect()
      observedOrderSection = orderSection
      observer.observe(orderSection)
    }

    const mutationObserver = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(observeOrderSection)
    mutationObserver?.observe(document.body, { childList: true, subtree: true })

    observeOrderSection()
    return () => {
      observer.disconnect()
      mutationObserver?.disconnect()
    }
  }, [])

  if (isOrderVisible) return null

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      <Button asChild size="lg" className="w-full h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-300/50">
        <a href={href}>{label} <ArrowRight className="ml-1 h-4 w-4" /></a>
      </Button>
    </div>
  )
}
