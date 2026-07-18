'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import {
  Upload, X, Sparkles, RotateCw, ZoomIn, Check, Trash2, ImagePlus,
  CheckCircle2, ArrowRight, Wand2, Sun as SunIcon, Palette, Droplet,
  Info, SunMedium, Contrast as ContrastIcon, Thermometer,
} from 'lucide-react'

// ==== Print constants ====
const MM_TOTAL = 70
const MM_VISIBLE = 65
const OUT_PX = 826                                   // 70mm @ 300 DPI (≈826.77)
const VISIBLE_FRACTION = MM_VISIBLE / MM_TOTAL       // 0.9286
const BLEED_FRACTION = (MM_TOTAL - MM_VISIBLE) / 2 / MM_TOTAL // 0.0357
const VISIBLE_RADIUS_MM = 4
const VISIBLE_RADIUS_PCT = (VISIBLE_RADIUS_MM / MM_TOTAL) * 100 // rounding of safe area in % of whole viewport

const FILTER_PRESETS = {
  none:    { css: '' },
  auto:    { css: 'saturate(1.12)' },
  bright:  { css: 'saturate(1.08)' },
  vibrant: { css: 'saturate(1.6)' },
  pastel:  { css: 'saturate(0.85) sepia(0.1)' },
}
const FILTER_ICONS = { none: Sparkles, auto: Wand2, bright: SunIcon, vibrant: Droplet, pastel: Palette }

const DEFAULT_ADJUST = {
  panX: 0, panY: 0,             // fraction of viewport (before transform), −0.8..+0.8
  zoom: 1,                      // multiplier
  rotate: 0,                    // degrees
  brightness: 1,
  contrast: 1,
  warmth: 0,                    // −1..+1
  filter: 'none',
  configured: false,
}

const uid = () => Math.random().toString(36).slice(2, 10)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function buildFilterString(a) {
  const parts = [`brightness(${a.brightness})`, `contrast(${a.contrast})`]
  if (a.warmth > 0) parts.push(`sepia(${(a.warmth * 0.35).toFixed(3)})`)
  if (a.warmth < 0) parts.push(`hue-rotate(${(a.warmth * 25).toFixed(1)}deg)`)
  const p = FILTER_PRESETS[a.filter]?.css
  if (p) parts.push(p)
  return parts.join(' ')
}

// ------------------------------------------------------------------
// Consistent transform helpers (used in BOTH preview & canvas output)
// ------------------------------------------------------------------
// Rendering model:
//   Viewport is a square of side V. Represents the full 70×70mm print.
//   Image is drawn inside a wrapper. Wrapper size = V×V. Image is scaled to
//   "cover" the wrapper at zoom=1 (extending beyond the wrapper when the
//   image aspect ratio differs). Wrapper's overflow is hidden by an ancestor.
//   Wrapper transform (as CSS): translate(panX*100%, panY*100%) rotate(rot) scale(zoom)
//     Because CSS composes right-to-left, this yields (unrotated) visual result:
//     shift by (panX*V, panY*V) that is NOT affected by zoom.

function coverSize(nw, nh, V) {
  if (!nw || !nh) return { w: V, h: V }
  const s = Math.max(V / nw, V / nh)
  return { w: nw * s, h: nh * s }
}

// ==================================================================
// SMALL MAGNET PREVIEW  (grid card thumbnail)
// ==================================================================
function LivePreview({ item, sizeClass = 'w-full aspect-square' }) {
  const a = item.adjust
  const naturalRatio = item.natural?.w && item.natural?.h ? item.natural.w / item.natural.h : 1
  // For cover: if landscape (nw>nh), height=100%, width=auto scale; else width=100%, height=auto
  const imgStyle = naturalRatio >= 1
    ? { height: '100%', width: 'auto', maxWidth: 'none' }
    : { width: '100%', height: 'auto', maxWidth: 'none' }

  return (
    <div className={`relative ${sizeClass} rounded-2xl overflow-hidden`}>
      {/* metallic backdrop */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(120% 90% at 20% 10%, #fff7e6 0%, #f2e4c9 45%, #d9c7a1 100%)',
      }} />
      {/* magnet face at 65/70 of outer */}
      <div
        className="absolute overflow-hidden shadow-[0_10px_25px_-8px_rgba(120,80,20,0.35),inset_0_0_0_2px_rgba(255,255,255,0.6),inset_0_0_0_4px_rgba(220,180,90,0.4)] bg-black"
        style={{
          inset: `${BLEED_FRACTION * 100}%`,
          borderRadius: `${VISIBLE_RADIUS_MM / MM_VISIBLE * 100}%`,
        }}
      >
        {/* Wrapper carrying the transform. It represents the FULL 70×70 print
            expanded to 100/VISIBLE_FRACTION so its center 65×65 portion fills the face. */}
        <div
          className="absolute"
          style={{
            width: `${100 / VISIBLE_FRACTION}%`,
            height: `${100 / VISIBLE_FRACTION}%`,
            left: `${-BLEED_FRACTION * 100 / VISIBLE_FRACTION}%`,
            top: `${-BLEED_FRACTION * 100 / VISIBLE_FRACTION}%`,
            transform: `translate(${a.panX * 100}%, ${a.panY * 100}%) rotate(${a.rotate}deg) scale(${a.zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <img
            src={item.url}
            alt=""
            className="absolute left-1/2 top-1/2 pointer-events-none select-none"
            style={{
              ...imgStyle,
              transform: 'translate(-50%, -50%)',
              filter: buildFilterString(a),
            }}
            draggable={false}
          />
        </div>
        {/* subtle gloss */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: 'linear-gradient(120deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(0,0,0,0.15) 100%)',
        }} />
      </div>
    </div>
  )
}

// ==================================================================
// EDITOR
// ==================================================================
function Editor({ open, item, onClose, onSave, t }) {
  const [adjust, setAdjust] = useState(item?.adjust || DEFAULT_ADJUST)
  const [aiWorking, setAiWorking] = useState(false)
  const [saving, setSaving] = useState(false)

  const viewportRef = useRef(null)
  const adjustRef = useRef(adjust)
  useEffect(() => { adjustRef.current = adjust }, [adjust])

  const gestureRef = useRef({
    pointers: new Map(),
    baseAdjust: null,
    startDist: 0,
    startAngle: 0,
    startCentroid: { x: 0, y: 0 },
  })

  useEffect(() => { if (item) setAdjust(item.adjust || DEFAULT_ADJUST) }, [item?.id])

  if (!item) return null

  const set = (patch) => setAdjust((a) => ({ ...a, ...patch }))
  const reset = () => setAdjust({ ...DEFAULT_ADJUST })

  // ----- multitouch gesture handlers -----
  const refreshGestureBase = () => {
    const g = gestureRef.current
    g.baseAdjust = { ...adjustRef.current }
    const pts = Array.from(g.pointers.values())
    if (pts.length >= 2) {
      const [a, b] = pts
      const dx = b.x - a.x, dy = b.y - a.y
      g.startDist = Math.hypot(dx, dy) || 1
      g.startAngle = Math.atan2(dy, dx)
      g.startCentroid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    } else if (pts.length === 1) {
      g.startCentroid = { x: pts[0].x, y: pts[0].y }
    }
  }

  const localFromEvent = (e) => {
    const r = viewportRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, vp: r.width }
  }

  const onPointerDown = (e) => {
    if (!viewportRef.current) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    const p = localFromEvent(e)
    gestureRef.current.pointers.set(e.pointerId, { x: p.x, y: p.y })
    refreshGestureBase()
  }

  const onPointerMove = (e) => {
    const g = gestureRef.current
    if (!g.pointers.has(e.pointerId) || !g.baseAdjust) return
    const p = localFromEvent(e)
    g.pointers.set(e.pointerId, { x: p.x, y: p.y })
    const pts = Array.from(g.pointers.values())
    const vp = p.vp || 1

    if (pts.length === 1) {
      const dx = (pts[0].x - g.startCentroid.x) / vp
      const dy = (pts[0].y - g.startCentroid.y) / vp
      setAdjust((a) => ({
        ...a,
        panX: clamp(g.baseAdjust.panX + dx, -0.8, 0.8),
        panY: clamp(g.baseAdjust.panY + dy, -0.8, 0.8),
      }))
    } else if (pts.length >= 2) {
      const [a, b] = pts
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.hypot(dx, dy) || 1
      const angle = Math.atan2(dy, dx)
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2
      const ratio = dist / g.startDist
      const angleDelta = ((angle - g.startAngle) * 180) / Math.PI
      const panDx = (cx - g.startCentroid.x) / vp
      const panDy = (cy - g.startCentroid.y) / vp

      setAdjust((prev) => ({
        ...prev,
        zoom: clamp(g.baseAdjust.zoom * ratio, 0.5, 5),
        rotate: g.baseAdjust.rotate + angleDelta,
        panX: clamp(g.baseAdjust.panX + panDx, -0.8, 0.8),
        panY: clamp(g.baseAdjust.panY + panDy, -0.8, 0.8),
      }))
    }
  }

  const onPointerUp = (e) => {
    const g = gestureRef.current
    g.pointers.delete(e.pointerId)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    refreshGestureBase()
  }

  const onWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.92
    setAdjust((a) => ({ ...a, zoom: clamp(a.zoom * factor, 0.5, 5) }))
  }

  // ----- AI Auto-Enhance (histogram analysis) -----
  const runAiEnhance = async () => {
    setAiWorking(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = item.url
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej })

      const S = 128
      const c = document.createElement('canvas')
      c.width = S; c.height = S
      const ctx = c.getContext('2d')
      const scale = Math.min(S / img.naturalWidth, S / img.naturalHeight)
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
      ctx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh)
      const data = ctx.getImageData(0, 0, S, S).data

      let sumL = 0, sumR = 0, sumG = 0, sumB = 0, count = 0
      const hist = new Array(256).fill(0)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], al = data[i + 3]
        if (al < 8) continue
        const L = 0.299 * r + 0.587 * g + 0.114 * b
        hist[Math.round(L)]++
        sumL += L; sumR += r; sumG += g; sumB += b; count++
      }
      if (!count) return
      const avgL = sumL / count, avgR = sumR / count, avgB = sumB / count

      let acc = 0, lo = 0, hi = 255
      const need = count * 0.02
      for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= need) { lo = i; break } }
      acc = 0
      for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= need) { hi = i; break } }
      const spread = Math.max(1, hi - lo)

      const brightness = clamp(140 / Math.max(20, avgL), 0.9, 1.35)
      const contrast = clamp(220 / spread, 1.0, 1.6)
      const warmth = clamp((avgB - avgR) / 90, -0.35, 0.35)

      setAdjust((a) => ({
        ...a,
        brightness: +brightness.toFixed(3),
        contrast: +contrast.toFixed(3),
        warmth: +warmth.toFixed(3),
        filter: 'auto',
      }))
    } catch (err) {
      console.warn('AI enhance failed', err)
    } finally {
      setAiWorking(false)
    }
  }

  // ----- Bake to high-res canvas -----
  const bakeOutput = () => new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = OUT_PX
        canvas.height = OUT_PX
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, OUT_PX, OUT_PX)
        ctx.filter = buildFilterString(adjust) || 'none'

        // Mirror the CSS wrapper transform:
        //   T(V/2, V/2)  T(panX*V, panY*V)  R(rot)  S(zoom)  [ draw cover img centered ]
        ctx.translate(OUT_PX / 2, OUT_PX / 2)
        ctx.translate(adjust.panX * OUT_PX, adjust.panY * OUT_PX)
        ctx.rotate((adjust.rotate * Math.PI) / 180)
        ctx.scale(adjust.zoom, adjust.zoom)

        const cover = coverSize(img.naturalWidth, img.naturalHeight, OUT_PX)
        ctx.drawImage(img, -cover.w / 2, -cover.h / 2, cover.w, cover.h)

        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('toBlob failed'))
          resolve(blob)
        }, 'image/jpeg', 0.92)
      } catch (e) { reject(e) }
    }
    img.onerror = reject
    img.src = item.url
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const blob = await bakeOutput()
      const outputUrl = URL.createObjectURL(blob)
      onSave({ adjust: { ...adjust, configured: true }, outputBlob: blob, outputUrl })
    } catch (err) {
      console.error(err)
      onSave({ adjust: { ...adjust, configured: true } })
    } finally {
      setSaving(false)
    }
  }

  const filterCss = buildFilterString(adjust)
  const filterKeys = Object.keys(FILTER_PRESETS)
  const naturalRatio = item.natural?.w && item.natural?.h ? item.natural.w / item.natural.h : 1
  const imgStyleBase = naturalRatio >= 1
    ? { height: '100%', width: 'auto', maxWidth: 'none' }
    : { width: '100%', height: 'auto', maxWidth: 'none' }

  const svgMaskId = `sm-mask-${item.id}`
  const rxPct = VISIBLE_RADIUS_PCT

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[92vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-orange-500" /> {t.studio.editor.title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 md:px-5 pb-5 space-y-4">
          {/* ========== Viewport ========== */}
          <div className="relative w-full max-w-md mx-auto">
            <div
              ref={viewportRef}
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-900 select-none"
              style={{ touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
            >
              {/* Wrapper carrying transform */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${adjust.panX * 100}%, ${adjust.panY * 100}%) rotate(${adjust.rotate}deg) scale(${adjust.zoom})`,
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
              >
                <img
                  src={item.url}
                  alt=""
                  className="absolute left-1/2 top-1/2 pointer-events-none select-none"
                  style={{
                    ...imgStyleBase,
                    transform: 'translate(-50%, -50%)',
                    filter: filterCss,
                    willChange: 'filter',
                  }}
                  draggable={false}
                />
              </div>

              {/* Dim mask for the 2.5mm bleed area with rounded interior cut-out */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100" preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <mask id={svgMaskId}>
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <rect
                      x={BLEED_FRACTION * 100}
                      y={BLEED_FRACTION * 100}
                      width={VISIBLE_FRACTION * 100}
                      height={VISIBLE_FRACTION * 100}
                      rx={rxPct} ry={rxPct}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect x="0" y="0" width="100" height="100" fill="#000" fillOpacity="0.55" mask={`url(#${svgMaskId})`} />
              </svg>

              {/* Safe area outline */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${BLEED_FRACTION * 100}%`,
                  top: `${BLEED_FRACTION * 100}%`,
                  right: `${BLEED_FRACTION * 100}%`,
                  bottom: `${BLEED_FRACTION * 100}%`,
                  border: '2px solid rgba(255,255,255,0.95)',
                  borderRadius: `${rxPct / VISIBLE_FRACTION}%`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.15) inset',
                }}
              />
              {/* Outer bleed outline */}
              <div className="absolute inset-0 pointer-events-none" style={{ border: '1px dashed rgba(255,255,255,0.55)' }} />

              {/* Corner ticks on safe area */}
              {[
                { l: true, t: true }, { r: true, t: true },
                { l: true, b: true }, { r: true, b: true },
              ].map((pos, i) => (
                <div key={i} className="absolute pointer-events-none"
                  style={{
                    left: pos.l ? `${BLEED_FRACTION * 100}%` : undefined,
                    right: pos.r ? `${BLEED_FRACTION * 100}%` : undefined,
                    top: pos.t ? `${BLEED_FRACTION * 100}%` : undefined,
                    bottom: pos.b ? `${BLEED_FRACTION * 100}%` : undefined,
                    width: 18, height: 18,
                    borderTop: pos.t ? '3px solid #fff' : undefined,
                    borderBottom: pos.b ? '3px solid #fff' : undefined,
                    borderLeft: pos.l ? '3px solid #fff' : undefined,
                    borderRight: pos.r ? '3px solid #fff' : undefined,
                  }}
                />
              ))}

              {/* Chips */}
              <div className="absolute top-2 left-2 pointer-events-none">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-neutral-800">
                  {t.studio.editor.safeArea}
                </span>
              </div>
              <div className="absolute top-2 right-2 pointer-events-none">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                  {t.studio.editor.bleed}
                </span>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/95 text-neutral-700 shadow whitespace-nowrap">
                  ✋ {t.studio.editor.pan}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-start gap-2 text-[11px] text-neutral-600 leading-relaxed">
              <Info className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
              <span>{t.studio.editor.bleedNote}</span>
            </div>
          </div>

          {/* AI button */}
          <Button
            type="button" onClick={runAiEnhance} disabled={aiWorking}
            className="w-full h-11 rounded-full bg-gradient-to-r from-fuchsia-500 via-orange-500 to-amber-500 hover:opacity-95 text-white shadow-lg shadow-orange-200 font-semibold"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {aiWorking ? t.studio.editor.aiEnhancing : t.studio.editor.aiEnhance}
            <span className="ml-2 text-[10px] font-bold bg-white/25 rounded-full px-1.5 py-0.5">AI</span>
          </Button>

          {/* Zoom / Rotate */}
          <div className="grid gap-4 sm:grid-cols-2">
            <SliderRow icon={ZoomIn} label={t.studio.editor.zoom}
              value={adjust.zoom} min={0.5} max={4} step={0.01}
              onChange={(v) => set({ zoom: v })}
              fmt={(v) => `${v.toFixed(2)}x`} />
            <SliderRow icon={RotateCw} label={t.studio.editor.rotate}
              value={adjust.rotate} min={-180} max={180} step={1}
              onChange={(v) => set({ rotate: v })}
              fmt={(v) => `${Math.round(v)}°`} />
          </div>

          {/* Adjustments */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 md:p-4">
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> {t.studio.editor.adjustments}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SliderRow icon={SunMedium} label={t.studio.editor.brightness}
                value={adjust.brightness} min={0.5} max={1.6} step={0.01}
                onChange={(v) => set({ brightness: v })}
                fmt={(v) => `${Math.round((v - 1) * 100)}`} />
              <SliderRow icon={ContrastIcon} label={t.studio.editor.contrast}
                value={adjust.contrast} min={0.5} max={1.8} step={0.01}
                onChange={(v) => set({ contrast: v })}
                fmt={(v) => `${Math.round((v - 1) * 100)}`} />
              <SliderRow icon={Thermometer} label={t.studio.editor.warmth}
                value={adjust.warmth} min={-1} max={1} step={0.01}
                onChange={(v) => set({ warmth: v })}
                fmt={(v) => `${Math.round(v * 100)}`} />
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" /> {t.studio.editor.filter}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {filterKeys.map((k) => {
                const Icon = FILTER_ICONS[k] || Sparkles
                const active = adjust.filter === k
                const preview = buildFilterString({ ...adjust, filter: k })
                return (
                  <button key={k} onClick={() => set({ filter: k })}
                    className={`group relative rounded-xl overflow-hidden border transition ${active ? 'border-orange-500 ring-2 ring-orange-200' : 'border-neutral-200 hover:border-orange-300'}`}>
                    <div className="aspect-square relative bg-neutral-900">
                      <img src={item.url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: preview }} />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 flex items-center justify-center gap-1 backdrop-blur-sm">
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{t.studio.editor.filters[k]}</span>
                      </div>
                      {active && (
                        <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-orange-500 text-white grid place-items-center">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="ghost" onClick={reset} className="text-neutral-600" disabled={saving}>
              {t.studio.editor.reset}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-full" disabled={saving}>
                {t.studio.editor.cancel}
              </Button>
              <Button onClick={handleSave} disabled={saving}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200">
                {saving ? t.studio.editor.saving : (<><Check className="h-4 w-4 mr-1" /> {t.studio.editor.save}</>)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SliderRow({ icon: Icon, label, value, min, max, step, onChange, fmt }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
        <span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-orange-500" /> {label}</span>
        <span className="tabular-nums text-neutral-500">{fmt(value)}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(v) => onChange(v[0])} />
    </div>
  )
}

// ==================================================================
// STUDIO
// ==================================================================
export default function MagnetStudio({ t, onUseThese }) {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const configuredCount = items.filter((i) => i.adjust.configured).length
  const totalCount = items.length

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    const newItems = files.slice(0, 20).map((f) => ({
      id: uid(),
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      natural: { w: 0, h: 0 },
      adjust: { ...DEFAULT_ADJUST },
      outputUrl: null,
      outputBlob: null,
    }))
    // Preload naturals
    newItems.forEach((it) => {
      const img = new Image()
      img.onload = () => {
        setItems((prev) => prev.map((p) => p.id === it.id
          ? { ...p, natural: { w: img.naturalWidth, h: img.naturalHeight } }
          : p))
      }
      img.src = it.url
    })
    setItems((prev) => [...prev, ...newItems].slice(0, 20))
  }, [])

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }

  const removeItem = (id) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === id)
      if (found?.url) try { URL.revokeObjectURL(found.url) } catch {}
      if (found?.outputUrl) try { URL.revokeObjectURL(found.outputUrl) } catch {}
      return prev.filter((p) => p.id !== id)
    })
  }
  const clearAll = () => {
    items.forEach((i) => {
      try { URL.revokeObjectURL(i.url) } catch {}
      if (i.outputUrl) try { URL.revokeObjectURL(i.outputUrl) } catch {}
    })
    setItems([])
  }

  const editing = items.find((i) => i.id === editingId) || null
  const openEditor = (id) => setEditingId(id)
  const saveEditor = ({ adjust, outputBlob, outputUrl }) => {
    setItems((prev) => prev.map((p) => {
      if (p.id !== editingId) return p
      if (p.outputUrl && outputUrl && p.outputUrl !== outputUrl) {
        try { URL.revokeObjectURL(p.outputUrl) } catch {}
      }
      return {
        ...p,
        adjust,
        outputBlob: outputBlob || p.outputBlob,
        outputUrl: outputUrl || p.outputUrl,
      }
    }))
    setEditingId(null)
  }

  const unlockedPromo = configuredCount >= 10
  const freeCount = Math.floor(configuredCount / 11)

  return (
    <section id="studio" className="relative py-14 md:py-20 bg-gradient-to-b from-white via-amber-50/40 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none rounded-full">{t.studio.badge}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">{t.studio.title}</h2>
          <p className="mt-3 text-neutral-600">{t.studio.subtitle}</p>
        </div>

        <div className="mt-8">
          <label
            htmlFor="studio-input"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 md:p-8 text-center transition ${dragOver ? 'border-orange-500 bg-orange-50' : 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'}`}
          >
            <input id="studio-input" ref={inputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            <div className="mx-auto h-12 w-12 rounded-full bg-white border border-amber-200 grid place-items-center shadow-sm">
              <Upload className="h-5 w-5 text-orange-500" />
            </div>
            <div className="mt-3 font-semibold text-neutral-800">{t.studio.uploadHint}</div>
            <div className="text-xs text-neutral-500 mt-1">{t.studio.supported}</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <span><ImagePlus className="h-4 w-4 mr-1" />{items.length ? t.studio.addMore : t.studio.uploadCta}</span>
              </Button>
              {items.length > 0 && (
                <Button type="button" variant="outline" size="sm" className="rounded-full"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearAll() }}>
                  <Trash2 className="h-4 w-4 mr-1" /> {t.studio.clearAll}
                </Button>
              )}
            </div>
          </label>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 text-center text-neutral-500">
            <div className="mx-auto max-w-sm rounded-2xl border border-amber-100 bg-white p-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 grid place-items-center">
                <ImagePlus className="h-6 w-6 text-orange-500" />
              </div>
              <div className="mt-3 font-semibold text-neutral-800">{t.studio.empty}</div>
              <div className="mt-1 text-sm">{t.studio.emptyDesc}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500 text-white grid place-items-center shadow">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm text-neutral-700">
                    <span className="font-extrabold text-neutral-900 text-lg">{configuredCount}</span>{' '}
                    <span className="text-neutral-500">{t.studio.of}</span>{' '}
                    <span className="font-bold">{totalCount}</span>{' '}
                    {t.studio.magnets} {t.studio.configured}
                  </div>
                  <div className="text-xs text-neutral-500">{configuredCount} {t.studio.totalReady}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unlockedPromo && (
                  <Badge className="bg-orange-500 text-white hover:bg-orange-500 rounded-full">
                    🎁 {t.studio.applyPromo}{freeCount > 0 ? ` (+${freeCount})` : ''}
                  </Badge>
                )}
                <Button disabled={configuredCount === 0}
                  onClick={() => onUseThese?.({ total: totalCount, configured: configuredCount, freeCount, items })}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200 disabled:opacity-50">
                  {t.studio.useThese} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((it, idx) => {
                const done = it.adjust.configured
                return (
                  <Card key={it.id} className="group border-amber-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-3">
                      <div className="relative">
                        <LivePreview item={it} />
                        <button onClick={() => removeItem(it.id)}
                          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                          aria-label="Remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="absolute top-1.5 left-1.5">
                          {done ? (
                            <Badge className="bg-green-500/95 text-white hover:bg-green-500 rounded-full text-[10px] px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {t.studio.saved}
                            </Badge>
                          ) : (
                            <Badge className="bg-white/90 text-amber-900 hover:bg-white border border-amber-200 rounded-full text-[10px] px-2 py-0.5">
                              #{idx + 1}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => openEditor(it.id)} variant={done ? 'outline' : 'default'} size="sm"
                        className={`mt-3 w-full rounded-full ${done ? '' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'}`}>
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                        {done ? t.studio.edit : t.studio.needsSetup}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Editor open={!!editing} item={editing} onClose={() => setEditingId(null)} onSave={saveEditor} t={t} />
    </section>
  )
}
