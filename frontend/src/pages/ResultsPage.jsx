/**
 * PureGlow AI - Results Page
 * ===========================
 * Pink pixel boutique style to match the Home Page and Quiz Page.
 *
 * Displays the recommendation bundle returned by /api/recommend:
 *   - Profile summary
 *   - Skincare recommendations
 *   - Makeup recommendations
 *   - Colour palette visualisation
 *   - "Why this?" explain modal
 *   - CTAs: routine builder and retake quiz
 */

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Droplets,
  ExternalLink,
  Heart,
  HelpCircle,
  Loader2,
  Palette,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Wand2,
  X,
} from 'lucide-react'
import { useQuiz } from '../context/QuizContext'
import { getExplanation, getRecommendations } from '../api/client'

// ============================================================================
// Pink pixel theme helpers
// ============================================================================

function PixelGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
  )
}

function Scallop({ position = 'top', color = '#ffd6e8' }) {
  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 h-9 ${
        position === 'top' ? 'top-0' : 'bottom-0 rotate-180'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 32px -6px, ${color} 30px, transparent 31px)`,
        backgroundSize: '64px 36px',
      }}
    />
  )
}

function PageDecorations() {
  return (
    <>
      <div className="pointer-events-none absolute left-8 top-32 text-7xl text-[#b77896]/45 animate-float">
        ✦
      </div>
      <div className="pointer-events-none absolute right-10 top-40 text-6xl text-[#67384f]">
        ✿
      </div>
      <div className="pointer-events-none absolute bottom-20 left-10 hidden text-7xl md:block animate-float">
        🌸
      </div>
      <div className="pointer-events-none absolute bottom-28 right-12 hidden text-7xl md:block animate-float">
        🎀
      </div>
      <div className="pointer-events-none absolute left-[12%] top-[54%] hidden text-5xl opacity-70 lg:block">
        💗
      </div>
    </>
  )
}

function FullPinkPage({ children, className = '' }) {
  return (
    <main
      className={`relative left-1/2 min-h-screen w-screen -translate-x-1/2 overflow-hidden bg-[#ffc0dd] text-[#4a2335] ${className}`}
    >
      <PixelGrid />
      <Scallop position="top" />
      <Scallop position="bottom" color="#ffd6e8" />
      <PageDecorations />
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        {children}
      </div>
    </main>
  )
}

function formatLabel(value) {
  if (!value) return ''

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function scoreToPercent(score) {
  const numeric = Number(score)
  if (Number.isNaN(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric * 100)))
}

// ============================================================================
// Profile Summary Banner
// ============================================================================

function ProfileSummary({ profile }) {
  if (!profile) return null

  const pills = [
    { label: 'Skin type', value: profile.skin_type, emoji: '🧴' },
    ...(profile.concerns || []).map((concern) => ({
      label: 'Concern',
      value: concern,
      emoji: '🌸',
    })),
    profile.undertone && { label: 'Undertone', value: profile.undertone, emoji: '🎀' },
    profile.skin_tone && { label: 'Skin tone', value: profile.skin_tone, emoji: '✨' },
  ].filter(Boolean)

  return (
    <section className="mb-12 rounded-[3rem] border-4 border-white bg-white/80 p-6 shadow-[9px_9px_0_#e48ab8] md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ffd6e8] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#d95199] shadow-[3px_3px_0_#f6b9d4]">
            <Heart size={14} fill="currentColor" />
            Your glow profile
          </div>

          <h2 className="text-3xl font-black leading-tight text-[#4a2335] md:text-4xl">
            PureGlow picked these ideas for your skin.
          </h2>

          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#70435b]">
            Your quiz answers help PureGlow match skincare, makeup shades and routine ideas
            to your skin type, concerns, undertone and tone.
          </p>
        </div>

        <div className="rounded-[2rem] border-4 border-white bg-[#fff2f8] p-4 shadow-[5px_5px_0_#ffd6e8]">
          <div className="flex flex-wrap gap-2">
            {pills.map((pill, i) => (
              <span
                key={`${pill.label}-${pill.value}-${i}`}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white px-4 py-2 text-sm font-black text-[#4a2335] shadow-[3px_3px_0_#ffd6e8]"
              >
                <span>{pill.emoji}</span>
                <span className="text-[#d95199]">{pill.label}:</span>
                <span>{formatLabel(pill.value)}</span>
              </span>
            ))}
          </div>

          <Link
            to="/quiz"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-5 py-3 text-sm font-black text-white no-underline shadow-[5px_5px_0_#d95199] transition hover:-translate-y-1 hover:bg-[#e94c99]"
          >
            <RefreshCcw className="h-4 w-4" />
            Retake Quiz
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Section wrapper with collapsible header
// ============================================================================

function Section({ icon: Icon, title, subtitle, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-12">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group mb-6 flex w-full items-center justify-between rounded-[2rem] border-4 border-white bg-white/80 px-5 py-4 text-left shadow-[6px_6px_0_#f6b9d4] transition hover:-translate-y-1 hover:bg-[#fff4fa]"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-[#ffd6e8] text-[#d95199] shadow-[4px_4px_0_#f6b9d4]">
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-[#4a2335] md:text-2xl">
                {title}
              </h2>
              {count != null && (
                <span className="rounded-full bg-[#f064a8] px-3 py-1 text-xs font-black text-white shadow-[2px_2px_0_#d95199]">
                  {count}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm font-semibold leading-6 text-[#70435b]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-[#fff2f8] text-[#d95199]">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {open && <div className="animate-fade-in">{children}</div>}
    </section>
  )
}

// ============================================================================
// Cute product card
// ============================================================================

function CuteProductCard({ product, rank, onExplain, type = 'skincare' }) {
  const {
    name = 'Unknown Product',
    brand = '',
    category = '',
    product_type = '',
    price,
    rating,
    relevance_score = 0,
    hex_color,
    color_name,
    url,
  } = product

  const displayCategory = type === 'makeup' ? product_type : category
  const scorePercent = scoreToPercent(relevance_score)
  const emoji = type === 'makeup' ? '🎀' : '🧴'

  return (
    <article className="group relative flex h-full flex-col rounded-[2.5rem] border-4 border-white bg-white p-5 shadow-[8px_8px_0_#e48ab8] transition duration-300 hover:-translate-y-2 hover:bg-[#fff8fb]">
      {rank && (
        <div className="absolute -left-3 -top-3 grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-[#f064a8] text-sm font-black text-white shadow-[4px_4px_0_#d95199]">
          {rank}
        </div>
      )}

      <div className="mb-5 rounded-[2rem] border-4 border-[#ffd6e8] bg-[#fff2f8] p-4 text-center shadow-inner">
        {hex_color ? (
          <div
            className="mx-auto mb-3 h-20 w-20 rounded-full border-4 border-white shadow-[4px_4px_0_#f6b9d4]"
            style={{ backgroundColor: hex_color }}
            title={color_name || hex_color}
          />
        ) : (
          <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-[#ffd6e8] text-4xl shadow-[4px_4px_0_#f6b9d4]">
            {emoji}
          </div>
        )}

        {displayCategory && (
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d95199]">
            {formatLabel(displayCategory)}
          </p>
        )}
      </div>

      <h3 className="line-clamp-2 text-lg font-black leading-snug text-[#4a2335]">
        {name}
      </h3>

      {brand && (
        <p className="mt-2 text-sm font-semibold text-[#70435b]">
          by <span className="font-black text-[#4a2335]">{brand}</span>
        </p>
      )}

      {color_name && (
        <p className="mt-2 rounded-full bg-[#ffd6e8] px-3 py-1 text-xs font-black text-[#a7346f]">
          Shade: {color_name}
        </p>
      )}

      <div className="flex-1" />

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#fff2f8] px-4 py-3">
        {price != null && !Number.isNaN(Number(price)) ? (
          <span className="text-lg font-black text-[#4a2335]">
            £{Number(price).toFixed(2)}
          </span>
        ) : (
          <span className="text-sm font-semibold text-[#70435b]">Price N/A</span>
        )}

        {rating != null && !Number.isNaN(Number(rating)) && (
          <div className="flex items-center gap-1 text-sm font-black text-[#4a2335]">
            <Star className="h-4 w-4 fill-[#f064a8] text-[#f064a8]" />
            {Number(rating).toFixed(1)}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span className="text-[#70435b]">Match score</span>
          <span className="text-[#d95199]">{scorePercent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#ffd6e8]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f6a8cc] to-[#f064a8] transition-all duration-700"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {onExplain && (
          <button
            type="button"
            onClick={() => onExplain(product)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ffd6e8] px-4 py-2.5 text-sm font-black text-[#a7346f] transition hover:-translate-y-0.5 hover:bg-[#ffc1db]"
          >
            <HelpCircle className="h-4 w-4" />
            Why this?
          </button>
        )}

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#fff2f8] px-4 py-2.5 text-sm font-black text-[#70435b] no-underline transition hover:-translate-y-0.5 hover:bg-[#ffd6e8]"
          >
            <ExternalLink className="h-4 w-4" />
            View
          </a>
        )}
      </div>
    </article>
  )
}

// ============================================================================
// Colour Palette Display
// ============================================================================

function PaletteDisplay({ palette, undertone }) {
  if (!palette || Object.keys(palette).length === 0) return null

  const productTypes = Object.entries(palette)

  return (
    <div className="rounded-[3rem] border-4 border-white bg-white p-6 shadow-[8px_8px_0_#e48ab8] md:p-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ffd6e8] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#d95199]">
          <Palette className="h-4 w-4" />
          Colour guide
        </div>
        <p className="mx-auto max-w-2xl text-sm font-semibold leading-7 text-[#70435b]">
          These shade words are curated for{' '}
          <span className="font-black text-[#d95199]">{formatLabel(undertone) || 'your'}</span>{' '}
          undertone. Use them as soft shopping keywords.
        </p>
      </div>

      <div className="space-y-6">
        {productTypes.map(([type, shades]) => (
          <div key={type} className="rounded-[2rem] bg-[#fff2f8] p-5">
            <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#d95199]">
              {formatLabel(type)}
            </h3>
            <div className="flex flex-wrap gap-3">
              {(Array.isArray(shades) ? shades : [shades]).map((shade, i) => (
                <span
                  key={`${type}-${shade}-${i}`}
                  className="rounded-full border-2 border-white bg-white px-4 py-2 text-sm font-black text-[#4a2335] shadow-[3px_3px_0_#ffd6e8]"
                >
                  ✨ {formatLabel(shade)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Explain Modal
// ============================================================================

function ExplainModal({ product, profile, onClose }) {
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchExplanation() {
      setLoading(true)
      setError(null)

      const result = await getExplanation({
        product_id: product.product_id,
        skin_type: profile.skin_type,
        concerns: profile.concerns || [],
      })

      if (cancelled) return

      if (result.success) {
        setExplanation(result.data)
      } else {
        setError(result.message || 'Could not load the explanation.')
      }

      setLoading(false)
    }

    fetchExplanation()

    return () => {
      cancelled = true
    }
  }, [product.product_id, profile.skin_type, profile.concerns])

  const skinTypeComponent = explanation?.components?.skin_type
  const concernComponents = explanation?.components?.concerns || []
  const ratingComponent = explanation?.components?.rating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#4a2335]/45 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 max-h-[84vh] w-full max-w-xl overflow-y-auto rounded-[3rem] border-4 border-white bg-white p-6 shadow-[12px_12px_0_#d95199] animate-slide-up md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-[#ffd6e8] text-[#d95199] transition hover:bg-[#ffc1db]"
          aria-label="Close explanation modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ffd6e8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#d95199]">
            <Sparkles className="h-4 w-4" />
            Why this?
          </div>
          <h3 className="text-2xl font-black text-[#4a2335]">Product match details</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#70435b]">
            Score breakdown for <span className="font-black text-[#d95199]">{product.name}</span>
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#f064a8]" />
            <p className="font-bold text-[#70435b]">Loading your cute match explanation...</p>
          </div>
        )}

        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        {explanation && (
          <div className="mt-6 space-y-5">
            <div className="rounded-[2rem] border-4 border-[#ffd6e8] bg-[#fff2f8] py-6 text-center">
              <p className="mb-1 text-sm font-black uppercase tracking-[0.18em] text-[#d95199]">
                Total relevance score
              </p>
              <p className="text-5xl font-black text-[#f064a8] drop-shadow-[3px_3px_0_#ffd6e8]">
                {scoreToPercent(explanation.total_score)}%
              </p>
            </div>

            {skinTypeComponent && (
              <ScoreRow
                title="Skin type match"
                matched={skinTypeComponent.matched}
                contribution={skinTypeComponent.contribution}
              />
            )}

            {concernComponents.map((concern, i) => (
              <ScoreRow
                key={`${concern.concern}-${i}`}
                title={formatLabel(concern.concern)}
                matched={concern.matched}
                contribution={concern.contribution}
              />
            ))}

            {ratingComponent && (
              <div className="rounded-2xl bg-[#fff2f8] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#4a2335]">Product rating</span>
                    {ratingComponent.value != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-black text-[#70435b]">
                        <Star className="h-3 w-3 fill-[#f064a8] text-[#f064a8]" />
                        {Number(ratingComponent.value).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span className="font-black text-[#d95199]">
                    +{scoreToPercent(ratingComponent.contribution)}%
                  </span>
                </div>
              </div>
            )}

            {explanation.tags_matched && explanation.tags_matched.length > 0 && (
              <div className="rounded-[2rem] bg-[#fff2f8] p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#d95199]">
                  Tags matched
                </p>
                <div className="flex flex-wrap gap-2">
                  {explanation.tags_matched.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#70435b] shadow-[2px_2px_0_#ffd6e8]"
                    >
                      {formatLabel(tag)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreRow({ title, matched, contribution }) {
  return (
    <div className="rounded-2xl bg-[#fff2f8] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[#4a2335]">{title}</span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-black ${
              matched ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {matched ? 'Yes' : 'No'}
          </span>
        </div>
        <span className="font-black text-[#d95199]">+{scoreToPercent(contribution)}%</span>
      </div>
    </div>
  )
}

// ============================================================================
// Empty / Loading / Error states
// ============================================================================

function EmptyState({ message, action }) {
  return (
    <div className="rounded-[3rem] border-4 border-white bg-white/80 px-6 py-12 text-center shadow-[7px_7px_0_#e48ab8]">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#ffd6e8] text-3xl shadow-[4px_4px_0_#f6b9d4]">
        🌷
      </div>
      <p className="mx-auto mb-5 max-w-md font-semibold leading-7 text-[#70435b]">
        {message}
      </p>
      {action}
    </div>
  )
}

function LoadingState() {
  return (
    <FullPinkPage>
      <div className="mx-auto max-w-md rounded-[3rem] border-4 border-white bg-white/85 p-10 text-center shadow-[9px_9px_0_#e48ab8]">
        <Loader2 className="mx-auto mb-5 h-12 w-12 animate-spin text-[#f064a8]" />
        <h1 className="text-3xl font-black text-[#4a2335]">Making your glow results...</h1>
        <p className="mt-3 font-semibold leading-7 text-[#70435b]">
          PureGlow AI is checking your skin profile and matching cute skincare ideas.
        </p>
      </div>
    </FullPinkPage>
  )
}

function ErrorState({ message }) {
  return (
    <FullPinkPage>
      <div className="mx-auto max-w-md rounded-[3rem] border-4 border-white bg-white/85 p-8 text-center shadow-[9px_9px_0_#e48ab8]">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[#ffd6e8] text-3xl shadow-[4px_4px_0_#f6b9d4]">
          💔
        </div>
        <h1 className="text-2xl font-black text-[#4a2335]">Something went wrong</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#70435b]">
          {message}
        </p>
        <Link
          to="/quiz"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-6 py-3 font-black text-white no-underline shadow-[5px_5px_0_#d95199] transition hover:-translate-y-1"
        >
          Retake Quiz
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </FullPinkPage>
  )
}

// ============================================================================
// Main ResultsPage
// ============================================================================

export default function ResultsPage() {
  const { state, dispatch } = useQuiz()
  const [explainProduct, setExplainProduct] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchIfNeeded() {
      if (!state.skin_type || state.results || state.loading) return

      dispatch({ type: 'SET_LOADING' })

      const profile = {
        skin_type: state.skin_type,
        concerns: state.concerns.length > 0 ? state.concerns : undefined,
        undertone: state.undertone || undefined,
        skin_tone: state.skin_tone || undefined,
        top_n: 10,
      }

      const result = await getRecommendations(profile)

      if (cancelled) return

      if (result.success) {
        dispatch({ type: 'SET_RESULTS', payload: result.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.message })
      }
    }

    fetchIfNeeded()

    return () => {
      cancelled = true
    }
  }, [
    state.skin_type,
    state.concerns,
    state.undertone,
    state.skin_tone,
    state.results,
    state.loading,
    dispatch,
  ])

  if (!state.skin_type) {
    return <Navigate to="/quiz" replace />
  }

  if (state.loading) {
    return <LoadingState />
  }

  if (state.error) {
    return <ErrorState message={state.error} />
  }

  const results = state.results
  const profile = results?.user_profile || {
    skin_type: state.skin_type,
    concerns: state.concerns,
    undertone: state.undertone,
    skin_tone: state.skin_tone,
  }

  const skincareRecs = results?.skincare_recommendations || []
  const makeupRecs = results?.makeup_recommendations || []
  const palette = results?.colour_palette || {}

  return (
    <FullPinkPage>
      {/* Page header */}
      <header className="mb-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/85 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#d95199] shadow-[4px_4px_0_#f69bc4]">
          <Sparkles className="h-4 w-4" fill="currentColor" />
          Personalised for you
          <Sparkles className="h-4 w-4" fill="currentColor" />
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[4px_4px_0_#e686b6] md:text-7xl">
          Your Glow
          <span className="block text-[#fff5fb]">Recommendations</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-semibold leading-8 text-[#6a3d55]">
          PureGlow Quiz found soft skincare, makeup colour ideas and routine suggestions that match
          your quiz answers.
        </p>
      </header>

      {/* Profile summary */}
      <ProfileSummary profile={profile} />

      {/* Skincare section */}
      <Section
        icon={Droplets}
        title="Skincare Recommendations"
        subtitle="Gentle product ideas selected from your skin type and concerns."
        count={skincareRecs.length}
      >
        {skincareRecs.length > 0 ? (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {skincareRecs.map((product, i) => (
              <CuteProductCard
                key={product.product_id || `${product.name}-${i}`}
                product={product}
                rank={i + 1}
                type="skincare"
                onExplain={() => setExplainProduct(product)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            message="No skincare matches were found for this profile. Try changing your skin type or concerns."
            action={
              <Link
                to="/quiz"
                className="inline-flex items-center justify-center rounded-full bg-[#f064a8] px-6 py-3 text-sm font-black text-white no-underline shadow-[5px_5px_0_#d95199] transition hover:-translate-y-1"
              >
                Adjust quiz answers
              </Link>
            }
          />
        )}
      </Section>

      {/* Makeup section */}
      {(makeupRecs.length > 0 || profile.undertone) && (
        <Section
          icon={Star}
          title="Makeup Recommendations"
          subtitle="Pretty shade ideas based on your tone and undertone."
          count={makeupRecs.length}
        >
          {makeupRecs.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {makeupRecs.map((product, i) => (
                <CuteProductCard
                  key={product.product_id || `${product.name}-${i}`}
                  product={product}
                  rank={i + 1}
                  type="makeup"
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No makeup matches were found. Try choosing an undertone in the quiz." />
          )}
        </Section>
      )}

      {/* Colour palette section */}
      {Object.keys(palette).length > 0 && (
        <Section
          icon={Palette}
          title="Your Colour Palette"
          subtitle="Cute shade names to help you choose blush, lipstick and soft makeup tones."
          count={null}
        >
          <PaletteDisplay palette={palette} undertone={profile.undertone} />
        </Section>
      )}

      {/* Bottom CTAs */}
      <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link
          to="/routine"
          className="group rounded-[3rem] border-4 border-white bg-white/85 p-6 text-[#4a2335] no-underline shadow-[8px_8px_0_#e48ab8] transition hover:-translate-y-2 hover:bg-[#fff8fb]"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-[#ffd6e8] text-[#d95199] shadow-[4px_4px_0_#f6b9d4]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black">Build Your Routine</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#70435b]">
                Turn your results into a clear daily skincare routine.
              </p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 flex-shrink-0 text-[#d95199] transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/quiz"
          className="group rounded-[3rem] border-4 border-white bg-white/85 p-6 text-[#4a2335] no-underline shadow-[8px_8px_0_#e48ab8] transition hover:-translate-y-2 hover:bg-[#fff8fb]"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl bg-[#ffd6e8] text-[#d95199] shadow-[4px_4px_0_#f6b9d4]">
              <RefreshCcw className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-black">Retake the Quiz</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#70435b]">
                Change your answers and get a fresh PureGlow result.
              </p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 flex-shrink-0 text-[#d95199] transition group-hover:translate-x-1" />
          </div>
        </Link>
      </section>

      {/* Cute note */}
      <div className="mx-auto mt-12 max-w-3xl rounded-[2.5rem] border-4 border-white bg-[#ffe1ee]/90 px-6 py-5 text-center shadow-[7px_7px_0_#f69bc4]">
        <div className="mb-2 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#d95199]">
          <Wand2 className="h-4 w-4" />
          PureGlow tip
        </div>
        <p className="font-semibold leading-7 text-[#70435b]">
          Results are beauty suggestions only. Always patch test new skincare products and stop using
          anything that irritates your skin.
        </p>
      </div>

      {/* Explain modal */}
      {explainProduct && (
        <ExplainModal
          product={explainProduct}
          profile={profile}
          onClose={() => setExplainProduct(null)}
        />
      )}
    </FullPinkPage>
  )
}
