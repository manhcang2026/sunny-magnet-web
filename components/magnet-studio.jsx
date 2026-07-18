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
} from 'lucide-react'

const FILTERS = {
  none:    { label: 'none',    css: 'none' },
  auto:    { label: 'auto',    css: 'contrast(1.15) saturate(1.15) brightness(1.05)' },
  bright:  { label: 'bright',  css: 'brightness(1.18) contrast(1.05) saturate(1.05)' },
  vibrant: { label: 'vibrant', css: 'saturate(1.6) contrast(1.12) brightness(1.02)' },
  pastel:  { label: 'pastel',  css: 'saturate(0.85) brightness(1.08) contrast(0.95) sepia(0.08)' },
}

const FILTER_ICONS = {
  none: Sparkles,
  auto: Wand2,
  bright: SunIcon,
  vibrant: Droplet,
  pastel: Palette,
}

const DEFAULT_ADJUST = { zoom: 1, rotate: 0, x: 0, y: 0, filter: 'none', configured: false }

const uid = () => Math.random().toString(36).slice(2, 10)

// A realistic square magnet preview: photo inside a rounded square with metallic ring + soft shadow on a metallic bg
function MagnetPreview({ item, sizeClass = 'w-full aspect-square' }) {
  const f = FILTERS[item.adjust.filter] || FILTERS.none
  return (
    <div className={`relative ${sizeClass} rounded-2xl overflow-hidden`}>
      {/* metallic-ish bg */}
      <div className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 20% 10%, #fff7e6 0%, #f2e4c9 45%, #d9c7a1 100%)',
        }}
      />
      {/* the "magnet" surface */}
      <div className="absolute inset-[8%] rounded-xl overflow-hidden shadow-[0_10px_25px_-8px_rgba(120,80,20,0.35),inset_0_0_0_2px_rgba(255,255,255,0.6),inset_0_0_0_4px_rgba(220,180,90,0.4)] bg-black">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={item.url}
            alt=""
            className="absolute left-1/2 top-1/2 h-full w-full object-cover select-none pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${item.adjust.x}%, ${item.adjust.y}%) scale(${item.adjust.zoom}) rotate(${item.adjust.rotate}deg)`,
              filter: f.css,
              transition: 'transform 250ms ease, filter 250ms ease',
              maxWidth: 'none',
            }}
            draggable={false}
          />
        </div>
        {/* subtle gloss */}
        <div className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(0,0,0,0.15) 100%)',
          }}
        />
      </div>
    </div>
  )
}

function Editor({ open, item, onClose, onSave, t }) {
  const [adjust, setAdjust] = useState(item?.adjust || DEFAULT_ADJUST)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 })

  useEffect(() => {
    if (item) setAdjust(item.adjust || DEFAULT_ADJUST)
  }, [item?.id])

  if (!item) return null

  const set = (patch) => setAdjust((a) => ({ ...a, ...patch }))
  const reset = () => setAdjust({ ...DEFAULT_ADJUST })

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: adjust.x,
      baseY: adjust.y,
    }
  }
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100
    set({
      x: Math.max(-60, Math.min(60, dragRef.current.baseX + dx)),
      y: Math.max(-60, Math.min(60, dragRef.current.baseY + dy)),
    })
  }
  const onPointerUp = () => { dragRef.current.dragging = false }

  const filterKeys = Object.keys(FILTERS)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-orange-500" /> {t.studio.editor.title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          <div
            className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <MagnetPreview item={{ ...item, adjust }} />
            <div className="pointer-events-none absolute inset-x-6 top-2 text-center text-[10px] uppercase tracking-widest text-amber-900/60 bg-white/60 backdrop-blur px-2 py-1 rounded-full inline-block mx-auto w-fit left-1/2 -translate-x-1/2">
              {t.studio.editor.pan}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span className="flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" /> {t.studio.editor.zoom}</span>
                <span className="tabular-nums text-neutral-500">{adjust.zoom.toFixed(2)}x</span>
              </div>
              <Slider
                min={1} max={3} step={0.01}
                value={[adjust.zoom]}
                onValueChange={(v) => set({ zoom: v[0] })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                <span className="flex items-center gap-1"><RotateCw className="h-3.5 w-3.5" /> {t.studio.editor.rotate}</span>
                <span className="tabular-nums text-neutral-500">{adjust.rotate}&deg;</span>
              </div>
              <Slider
                min={-180} max={180} step={1}
                value={[adjust.rotate]}
                onValueChange={(v) => set({ rotate: v[0] })}
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" /> {t.studio.editor.filter}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {filterKeys.map((k) => {
                const Icon = FILTER_ICONS[k] || Sparkles
                const active = adjust.filter === k
                return (
                  <button
                    key={k}
                    onClick={() => set({ filter: k })}
                    className={`group relative rounded-xl overflow-hidden border transition ${active ? 'border-orange-500 ring-2 ring-orange-200' : 'border-neutral-200 hover:border-orange-300'}`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={item.url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ filter: FILTERS[k].css }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-semibold px-1.5 py-0.5 flex items-center justify-center gap-1 backdrop-blur-sm">
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

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button variant="ghost" onClick={reset} className="text-neutral-600">
              {t.studio.editor.reset}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-full">
                {t.studio.editor.cancel}
              </Button>
              <Button
                onClick={() => onSave({ ...adjust, configured: true })}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200"
              >
                <Check className="h-4 w-4 mr-1" /> {t.studio.editor.save}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
      adjust: { ...DEFAULT_ADJUST },
    }))
    setItems((prev) => [...prev, ...newItems].slice(0, 20))
  }, [])

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeItem = (id) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === id)
      if (found?.url) try { URL.revokeObjectURL(found.url) } catch {}
      return prev.filter((p) => p.id !== id)
    })
  }
  const clearAll = () => {
    items.forEach((i) => { try { URL.revokeObjectURL(i.url) } catch {} })
    setItems([])
  }

  const editing = items.find((i) => i.id === editingId) || null
  const openEditor = (id) => setEditingId(id)
  const saveEditor = (adjust) => {
    setItems((prev) => prev.map((p) => (p.id === editingId ? { ...p, adjust } : p)))
    setEditingId(null)
  }

  const unlockedPromo = configuredCount >= 10
  const chargedCount = configuredCount >= 11 ? Math.max(configuredCount - Math.floor(configuredCount / 11), configuredCount - 1) : configuredCount
  // Simple Buy 10 Get 1 Free: for every 11 items, 1 is free.
  const freeCount = Math.floor(configuredCount / 11)

  return (
    <section id="studio" className="relative py-14 md:py-20 bg-gradient-to-b from-white via-amber-50/40 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-none rounded-full">{t.studio.badge}</Badge>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">{t.studio.title}</h2>
          <p className="mt-3 text-neutral-600">{t.studio.subtitle}</p>
        </div>

        {/* Upload area */}
        <div className="mt-8">
          <label
            htmlFor="studio-input"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 md:p-8 text-center transition ${dragOver ? 'border-orange-500 bg-orange-50' : 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'}`}
          >
            <input
              id="studio-input"
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
            />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearAll() }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> {t.studio.clearAll}
                </Button>
              )}
            </div>
          </label>
        </div>

        {/* Grid */}
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
            {/* Stats bar */}
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
                <Button
                  disabled={configuredCount === 0}
                  onClick={() => onUseThese?.({ total: totalCount, configured: configuredCount, freeCount })}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-200 disabled:opacity-50"
                >
                  {t.studio.useThese} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Cards */}
            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map((it, idx) => {
                const done = it.adjust.configured
                return (
                  <Card key={it.id} className="group border-amber-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-3">
                      <div className="relative">
                        <MagnetPreview item={it} />
                        <button
                          onClick={() => removeItem(it.id)}
                          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow grid place-items-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                          aria-label="Remove"
                        >
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
                      <Button
                        onClick={() => openEditor(it.id)}
                        variant={done ? 'outline' : 'default'}
                        size="sm"
                        className={`mt-3 w-full rounded-full ${done ? '' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'}`}
                      >
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
