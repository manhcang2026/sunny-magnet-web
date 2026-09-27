import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function StickyMobileCTA({ t }) {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      <Button asChild size="lg" className="w-full h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-300/50">
        <a href="#order">{t.nav.order} <ArrowRight className="ml-1 h-4 w-4" /></a>
      </Button>
    </div>
  )
}
