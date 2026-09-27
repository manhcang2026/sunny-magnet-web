'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'framer-motion'
import { ArrowRight, Camera, CheckCircle2, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { siteContent } from '@/content/site-content'

const { media } = siteContent
const SLIDE_DURATION = 4400
const TRANSITION_DURATION = 0.7
const SWIPE_THRESHOLD = 55
const SLIDE_EASE = [0.22, 1, 0.36, 1]
const SLIDE_EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DESKTOP_CROSSFADE_DURATION = 0.6
const SETTLE_POINT = TRANSITION_DURATION / (SLIDE_DURATION / 1000)

const slideVariants = {
  enter: ({ direction, reducedMotion }) => reducedMotion
    ? { opacity: 0, x: 0, scale: 1 }
    : { opacity: 0, x: `calc(${direction * 64}px + 0%)`, y: '0%', scale: 1.045 },
  center: ({ direction, reducedMotion, slideIndex }) => reducedMotion
    ? {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: { duration: 0.2, ease: SLIDE_EASE },
      }
    : {
        opacity: [0, 1, 1],
        x: [
          `calc(${direction * 64}px + 0%)`,
          'calc(0px + 0%)',
          `calc(0px + ${slideIndex % 2 === 0 ? '-1.5%' : '1.5%'})`,
        ],
        y: ['0%', '0%', slideIndex % 2 === 0 ? '-0.5%' : '0.5%'],
        scale: [1.045, 1, 1.075],
        transition: {
          duration: SLIDE_DURATION / 1000,
          times: [0, SETTLE_POINT, 1],
          ease: [SLIDE_EASE, 'linear'],
        },
      },
  exit: ({ reducedMotion }) => ({
    opacity: 0,
    transition: {
      duration: reducedMotion ? 0.2 : 0.4,
      ease: SLIDE_EASE,
    },
  }),
}

async function preloadAndDecodeImage(src) {
  try {
    const image = new window.Image()

    await new Promise((resolve) => {
      image.onload = resolve
      image.onerror = resolve
      image.src = src

      if (image.complete) resolve()
    })

    image.onload = null
    image.onerror = null

    if (typeof image.decode === 'function') {
      try {
        await image.decode()
      } catch {
        // A loaded image remains usable when decode() is unsupported or rejects.
      }
    }

    return image
  } catch {
    return null
  }
}

function MobileHeroSlide({ src, alt, direction, reducedMotion, slideIndex }) {
  const isPresent = useIsPresent()

  return (
    <motion.img
      src={src}
      alt={alt}
      custom={{ direction, reducedMotion, slideIndex }}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        zIndex: isPresent ? 1 : 0,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    />
  )
}

function HeroFrameChrome({
  idx,
  onShowSlide,
  prefersReducedMotion,
  printLabel,
  slidesPrewarmed,
  timerResetKey,
}) {
  return (
    <>
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex gap-1.5">
          {media.heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onShowSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === idx ? 'true' : undefined}
              className={`relative h-1.5 w-7 overflow-hidden rounded-full ${i === idx ? 'bg-white/50' : 'bg-white/30'}`}
            >
              {i === idx && (
                <motion.span
                  key={`${idx}-${timerResetKey}`}
                  className="absolute inset-0 origin-left bg-white"
                  initial={{ scaleX: prefersReducedMotion ? 1 : 0 }}
                  animate={{ scaleX: prefersReducedMotion || slidesPrewarmed ? 1 : 0 }}
                  transition={{
                    duration: prefersReducedMotion || !slidesPrewarmed ? 0 : SLIDE_DURATION / 1000,
                    ease: 'linear',
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <Badge className="bg-white/95 text-amber-900 hover:bg-white border-none shadow">
          <Sparkles className="mr-1 h-3 w-3" /> {printLabel}
        </Badge>
      </div>
    </>
  )
}

function MobileHeroMedia({
  direction,
  idx,
  onShowSlide,
  onSwipeEnd,
  prefersReducedMotion,
  printLabel,
  slidesPrewarmed,
  timerResetKey,
}) {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-orange-200 ring-1 ring-amber-200 md:hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence
          mode="sync"
          initial={false}
          custom={{ direction, reducedMotion: prefersReducedMotion, slideIndex: idx }}
        >
          <MobileHeroSlide
            key={media.heroSlides[idx]}
            src={media.heroSlides[idx]}
            alt={media.heroAlt}
            direction={direction}
            reducedMotion={prefersReducedMotion}
            slideIndex={idx}
          />
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute inset-0 z-10"
        style={{ touchAction: 'pan-y' }}
        onPanEnd={onSwipeEnd}
      />

      {!prefersReducedMotion && (
        <motion.div
          key={`gloss-${idx}`}
          className="pointer-events-none absolute inset-y-0 -left-1/2 z-10 w-1/3"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '500%', opacity: [0, 0.38, 0] }}
          transition={{
            duration: 0.75,
            delay: 0.12,
            times: [0, 0.45, 1],
            ease: SLIDE_EASE,
          }}
          style={{
            background: 'linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)',
            willChange: 'transform, opacity',
          }}
        />
      )}

      <HeroFrameChrome
        idx={idx}
        onShowSlide={onShowSlide}
        prefersReducedMotion={prefersReducedMotion}
        printLabel={printLabel}
        slidesPrewarmed={slidesPrewarmed}
        timerResetKey={timerResetKey}
      />
    </div>
  )
}

function DesktopHeroMedia({
  idx,
  onShowSlide,
  prefersReducedMotion,
  printLabel,
  slidesPrewarmed,
  timerResetKey,
}) {
  return (
    <div className="relative hidden aspect-[5/6] w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-orange-200 ring-1 ring-amber-200 md:block">
      <div className="absolute inset-0 z-0">
        {media.heroSlides.map((src, slideIndex) => (
          <img
            key={src}
            src={src}
            alt={media.heroAlt}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            style={{
              opacity: slideIndex === idx ? 1 : 0,
              transform: 'none',
              transition: `opacity ${prefersReducedMotion ? 0.2 : DESKTOP_CROSSFADE_DURATION}s ${SLIDE_EASE_CSS}`,
              willChange: 'opacity',
            }}
          />
        ))}
      </div>

      <HeroFrameChrome
        idx={idx}
        onShowSlide={onShowSlide}
        prefersReducedMotion={prefersReducedMotion}
        printLabel={printLabel}
        slidesPrewarmed={slidesPrewarmed}
        timerResetKey={timerResetKey}
      />
    </div>
  )
}

export default function Hero({ t }) {
  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState(1)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [slidesPrewarmed, setSlidesPrewarmed] = useState(false)
  const prewarmedImagesRef = useRef([])
  const prefersReducedMotion = useReducedMotion()
  const slideCount = media.heroSlides.length

  useEffect(() => {
    if (slideCount < 2 || !slidesPrewarmed) return undefined

    const timeoutId = setTimeout(() => {
      setDirection(1)
      setIdx((current) => (current + 1) % slideCount)
    }, SLIDE_DURATION)

    return () => clearTimeout(timeoutId)
  }, [idx, slideCount, slidesPrewarmed, timerResetKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    Promise.all(media.heroSlides.map(preloadAndDecodeImage)).then((images) => {
      if (cancelled) return

      prewarmedImagesRef.current = images.filter(Boolean)
      setSlidesPrewarmed(true)
    })

    return () => {
      cancelled = true
      prewarmedImagesRef.current = []
    }
  }, [])

  const moveSlide = (step) => {
    setDirection(step)
    setIdx((current) => (current + step + slideCount) % slideCount)
    setTimerResetKey((key) => key + 1)
  }

  const showSlide = (target) => {
    if (target !== idx) {
      setDirection(target > idx ? 1 : -1)
      setIdx(target)
    }
    setTimerResetKey((key) => key + 1)
  }

  const handleSwipeEnd = (_, { offset, velocity }) => {
    const swipeIntent = offset.x + velocity.x * 0.15
    if (swipeIntent <= -SWIPE_THRESHOLD) moveSlide(1)
    if (swipeIntent >= SWIPE_THRESHOLD) moveSlide(-1)
  }

  return (
    <section id="top" className="relative overflow-hidden bg-radial-sun">
      <div className="absolute inset-0 pointer-events-none opacity-70"
           style={{ background: 'radial-gradient(60% 40% at 50% 0%, rgba(255,193,7,0.35), transparent 70%)' }} />
      <div className="container mx-auto px-4 pt-10 pb-16 md:pt-20 md:pb-28">
        <div className="grid gap-10 md:gap-12 md:grid-cols-2 items-center">
          <div className="relative z-10">
            <div>
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
                {t.hero.badge}
              </Badge>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-balance">
                {t.hero.title}{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                    {t.hero.titleHighlight}
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 opacity-70" />
                </span>
              </h1>
              <p className="mt-5 text-lg md:text-xl text-neutral-600 max-w-xl text-balance">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-8 h-12 text-base shadow-lg shadow-orange-200">
                  <a href="#studio" className="flex items-center gap-2">
                    {t.hero.cta} <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-amber-300 bg-white hover:bg-amber-50 h-12 px-6">
                  <a href="#how">{t.hero.ctaSecondary}</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-neutral-600">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-500" />{t.hero.stat1}</span>
                <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-500 fill-amber-500" />{t.hero.stat2}</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-orange-500" />{t.hero.stat3}</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <MobileHeroMedia
              direction={direction}
              idx={idx}
              onShowSlide={showSlide}
              onSwipeEnd={handleSwipeEnd}
              prefersReducedMotion={prefersReducedMotion}
              printLabel={t.hero.visualBadges.print}
              slidesPrewarmed={slidesPrewarmed}
              timerResetKey={timerResetKey}
            />
            <DesktopHeroMedia
              idx={idx}
              onShowSlide={showSlide}
              prefersReducedMotion={prefersReducedMotion}
              printLabel={t.hero.visualBadges.print}
              slidesPrewarmed={slidesPrewarmed}
              timerResetKey={timerResetKey}
            />
            {/* Floating chips */}
            <motion.div
              className="hidden md:block absolute -left-6 top-10 z-30 rounded-2xl bg-white shadow-lg p-3 float-slow"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                  <Camera className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{t.hero.visualBadges.customTitle}</div>
                  <div className="text-sm font-semibold">{t.hero.visualBadges.customSubtitle}</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="hidden md:block absolute -right-4 bottom-8 z-30 rounded-2xl bg-white shadow-lg p-3 float-slow"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <div className="text-xs text-neutral-500">{t.hero.visualBadges.warrantyTitle}</div>
                  <div className="text-sm font-semibold">{t.hero.visualBadges.warrantySubtitle}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
