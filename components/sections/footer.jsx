import { MapPin, Phone, Sun } from 'lucide-react'
import { siteContent } from '@/content/site-content'

const { brand, contact, labels } = siteContent

export default function Footer({ t }) {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-white text-lg">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white">
                <Sun className="h-5 w-5" />
              </span>
              {brand.nameFirst} <span className="text-orange-400">{brand.nameHighlight}</span>
            </div>
            <p className="mt-3 text-sm text-neutral-400 max-w-xs">{t.footer.tagline}</p>
          </div>
          <div>
            <div className="text-white font-semibold">{t.footer.contact}</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-400" /> {contact.phone}</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" /> {contact.address}</li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold">{brand.name}</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-400">
              <li><a href="#how" className="hover:text-orange-300">{t.nav.how}</a></li>
              <li><a href="#gallery" className="hover:text-orange-300">{t.nav.gallery}</a></li>
              <li><a href="#pricing" className="hover:text-orange-300">{t.nav.pricing}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-neutral-800 text-xs text-neutral-500 flex items-center justify-between">
          <div>© {new Date().getFullYear()} {brand.name}. {t.footer.rights}</div>
          <div>{labels.footerMadeIn}</div>
        </div>
      </div>
    </footer>
  )
}
