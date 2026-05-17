/**
 * PureGlow - Routine Builder Page
 * Pink Pixel Theme Version
 * =================================
 *
 * Ready-to-run replacement for:
 * src/pages/RoutinePage.jsx
 */

import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Loader2,
  RefreshCcw,
  ArrowRight,
  Star,
  ExternalLink,
  Droplets,
  FlaskConical,
  CloudSun,
  Eye,
  Sparkles,
  SlidersHorizontal,
  Heart,
  Wand2,
} from 'lucide-react'
import { useQuiz } from '../context/QuizContext'
import { getRoutine } from '../api/client'

// ============================================================================
// Routine step metadata
// ============================================================================

const ROUTINE_STEPS = [
  {
    key: 'cleanser',
    label: 'Cleanser',
    icon: Droplets,
    time: 'Morning & Night',
    tip: 'Start with a clean canvas. Massage gently for 30–60 seconds, then rinse.',
    bg: '#ffe1ee',
    accent: '#f064a8',
    emoji: '🫧',
  },
  {
    key: 'treatment',
    label: 'Treatment / Serum',
    icon: FlaskConical,
    time: 'Morning & Night',
    tip: "Apply to damp skin after cleansing. Pat gently — don't rub.",
    bg: '#ffd6e8',
    accent: '#d95199',
    emoji: '💧',
  },
  {
    key: 'moisturiser',
    label: 'Moisturiser',
    icon: CloudSun,
    time: 'Morning & Night',
    tip: 'Lock in your serum with a moisturiser suited to your skin type.',
    bg: '#ffc1db',
    accent: '#f064a8',
    emoji: '🌸',
  },
  {
    key: 'eye_care',
    label: 'Eye Care',
    icon: Eye,
    time: 'Morning & Night',
    tip: 'Use your ring finger to gently dab around the orbital bone.',
    bg: '#fff0f7',
    accent: '#d95199',
    emoji: '✨',
  },
]

// ============================================================================
// Theme helpers
// ============================================================================

function PixelGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-55"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.34) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.34) 1px, transparent 1px), radial-gradient(circle at 14px 14px, rgba(255,255,255,.35) 1.5px, transparent 2px)',
        backgroundSize: '30px 30px, 30px 30px, 60px 60px',
      }}
    />
  )
}

function PixelBadge({ children, icon }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/85 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#d95199] shadow-[4px_4px_0_#f69bc4]">
      {icon}
      {children}
    </div>
  )
}

function PinkPanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-[2.5rem] border-4 border-white bg-white/85 shadow-[10px_10px_0_#e48ab8] ${className}`}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Budget Slider
// ============================================================================

function BudgetSlider({ value, onChange, totalCost }) {
  const budgetOptions = [50, 75, 100, 150, 200, 300, null]

  return (
    <PinkPanel className="mb-8 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-white bg-[#ffd6e8] text-[#d95199] shadow-[3px_3px_0_#f6b9d4]">
          <SlidersHorizontal className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d95199]">
            Routine budget
          </p>
          <h3 className="text-xl font-black text-[#4a2335]">
            {value ? `Up to $${value}` : 'No limit'}
          </h3>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {budgetOptions.map((opt) => {
          const selected = value === opt

          return (
            <button
              key={opt || 'none'}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-black transition hover:-translate-y-0.5 ${
                selected
                  ? 'border-white bg-[#f064a8] text-white shadow-[4px_4px_0_#d95199]'
                  : 'border-[#ffc1db] bg-white text-[#a7346f] shadow-[3px_3px_0_#ffe1ee] hover:bg-[#fff4fa]'
              }`}
            >
              {opt ? `$${opt}` : 'No limit'}
            </button>
          )
        })}
      </div>

      {totalCost > 0 && (
        <div className="flex items-center justify-between rounded-2xl border-2 border-white bg-[#fff4fa] px-4 py-3 shadow-[3px_3px_0_#ffd6e8]">
          <span className="text-sm font-bold text-[#70435b]">Estimated total</span>
          <span
            className={`text-xl font-black ${
              value && totalCost > value ? 'text-[#c44a5c]' : 'text-[#d95199]'
            }`}
          >
            ${totalCost.toFixed(2)}
          </span>
        </div>
      )}
    </PinkPanel>
  )
}

// ============================================================================
// Routine Slot Card
// ============================================================================

function RoutineSlot({ stepMeta, product, stepNumber, isLast }) {
  const { label, icon: Icon, time, tip, bg, accent, emoji } = stepMeta
  const hasProduct = product && product.name

  return (
    <div className="relative flex gap-4 md:gap-6">
      {/* Pixel timeline */}
      <div className="flex flex-col items-center">
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl border-4 border-white text-white shadow-[4px_4px_0_#d95199]"
          style={{ backgroundColor: hasProduct ? accent : '#f6b9d4' }}
        >
          <Icon className="h-6 w-6" />
        </div>

        {!isLast && (
          <div className="my-2 min-h-[46px] w-1 flex-1 rounded-full bg-white shadow-[2px_0_0_#f6b9d4]" />
        )}
      </div>

      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-8'}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#f064a8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[2px_2px_0_#d95199]">
            Step {stepNumber}
          </span>
          <span className="text-xs font-bold text-[#70435b]">♡ {time}</span>
        </div>

        <h3 className="mb-3 flex items-center gap-2 text-2xl font-black text-[#4a2335]">
          <span>{emoji}</span>
          {label}
        </h3>

        {hasProduct ? (
          <article
            className="rounded-[2rem] border-4 border-white p-5 shadow-[7px_7px_0_#f69bc4] transition hover:-translate-y-1"
            style={{ backgroundColor: bg }}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {product.category && (
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#d95199]">
                    {product.category}
                  </p>
                )}

                <h4 className="text-lg font-black text-[#4a2335]">{product.name}</h4>

                {product.brand && (
                  <p className="mt-1 text-sm font-semibold text-[#70435b]">
                    by <span className="font-black text-[#4a2335]">{product.brand}</span>
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {product.price != null && !isNaN(product.price) && (
                    <span className="rounded-full border-2 border-white bg-white px-4 py-2 text-lg font-black text-[#d95199] shadow-[3px_3px_0_#ffd6e8]">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  )}

                  {product.rating != null && !isNaN(product.rating) && (
                    <div className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-white px-3 py-2 font-black text-[#4a2335] shadow-[3px_3px_0_#ffd6e8]">
                      <Star className="h-4 w-4 fill-[#f064a8] text-[#f064a8]" />
                      {Number(product.rating).toFixed(1)}
                    </div>
                  )}
                </div>

                {product.relevance_score != null && (
                  <div className="mt-5">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#70435b]">Match</span>
                      <span className="font-black text-[#d95199]">
                        {Math.round(product.relevance_score * 100)}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border-2 border-white bg-white shadow-[2px_2px_0_#ffd6e8]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#ffc1db] to-[#f064a8] transition-all duration-700"
                        style={{ width: `${Math.round(product.relevance_score * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-white bg-white px-4 py-2 text-sm font-black text-[#d95199] no-underline shadow-[3px_3px_0_#f6b9d4] transition hover:-translate-y-0.5 hover:bg-[#fff4fa]"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </a>
              )}
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white bg-white/75 px-4 py-3 text-sm font-semibold leading-6 text-[#70435b] shadow-[3px_3px_0_#ffd6e8]">
              <span className="font-black text-[#d95199]">Tip:</span> {tip}
            </div>
          </article>
        ) : (
          <article className="rounded-[2rem] border-4 border-dashed border-white bg-white/70 p-5 shadow-[7px_7px_0_#f6b9d4]">
            <p className="font-bold text-[#70435b]">
              No matching {label.toLowerCase()} found for your profile
              {product === null ? ' within this budget' : ''}.
            </p>
            <p className="mt-1 text-sm font-semibold text-[#70435b]">
              Try increasing the budget or adjusting your quiz answers.
            </p>
          </article>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Main RoutinePage
// ============================================================================

export default function RoutinePage() {
  const { state } = useQuiz()
  const [budget, setBudget] = useState(null)
  const [routine, setRoutine] = useState(null)
  const [totalCost, setTotalCost] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRoutine = useCallback(
    async (budgetVal) => {
      if (!state.skin_type) return

      setLoading(true)
      setError(null)

      const params = {
        skin_type: state.skin_type,
        concerns: state.concerns.length > 0 ? state.concerns : undefined,
      }

      if (budgetVal != null) {
        params.max_budget = budgetVal
      }

      const result = await getRoutine(params)

      if (result.success) {
        setRoutine(result.data.routine)
        setTotalCost(result.data.total_cost || 0)
      } else {
        setError(result.message)
      }

      setLoading(false)
    },
    [state.skin_type, state.concerns],
  )

  useEffect(() => {
    fetchRoutine(budget)
  }, [budget, fetchRoutine])

  function handleBudgetChange(newBudget) {
    setBudget(newBudget)
  }

  const filledSteps = routine
    ? ROUTINE_STEPS.filter((step) => routine[step.key] && routine[step.key].name).length
    : 0

  if (!state.skin_type) {
    return <Navigate to="/quiz" replace />
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden px-5 py-10 text-[#4a2335] md:px-8 md:py-14"
      style={{
        background:
          'radial-gradient(circle at 12% 16%, rgba(255,255,255,.62) 0 8%, transparent 24%), radial-gradient(circle at 86% 12%, rgba(240,100,168,.30) 0 7%, transparent 26%), radial-gradient(circle at 50% 105%, rgba(255,255,255,.42) 0 10%, transparent 35%), linear-gradient(135deg, #fff2f8 0%, #ffd6e8 34%, #ffc0dd 68%, #ffaad1 100%)',
      }}
    >
      <PixelGrid />

      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-[#f064a8]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-white/30 blur-3xl" />

      <div className="pointer-events-none absolute left-8 top-24 text-7xl opacity-35">✦</div>
      <div className="pointer-events-none absolute right-10 top-40 text-7xl opacity-55">🌸</div>
      <div className="pointer-events-none absolute bottom-20 left-10 text-7xl opacity-45">💗</div>
      <div className="pointer-events-none absolute right-[18%] bottom-28 text-6xl opacity-40">✿</div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header */}
        <section className="mb-8 text-center">
          <PixelBadge icon={<Sparkles className="h-4 w-4" fill="currentColor" />}>
            Built for your skin
          </PixelBadge>

          <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[4px_4px_0_#e686b6] md:text-7xl">
            Your Daily
            <span className="block text-[#fff5fb]">Glow Routine.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl rounded-[2rem] border-2 border-white bg-white/80 px-6 py-4 text-base font-bold leading-7 text-[#70435b] shadow-[5px_5px_0_#f6b9d4]">
            A complete <span className="font-black text-[#d95199]">{state.skin_type}</span> skin
            routine for{' '}
            <span className="font-black text-[#d95199]">
              {state.concerns.length > 0
                ? state.concerns.map((c) => c.replace('_', ' ')).join(' + ')
                : 'healthy skin'}
            </span>
            .
          </p>
        </section>

        <BudgetSlider value={budget} onChange={handleBudgetChange} totalCost={totalCost} />

        {loading && (
          <PinkPanel className="my-8 p-10 text-center">
            <Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-[#d95199]" />
            <p className="font-black text-[#4a2335]">Building your routine...</p>
            <p className="mt-1 text-sm font-semibold text-[#70435b]">
              Matching your profile with cute skincare picks.
            </p>
          </PinkPanel>
        )}

        {error && !loading && (
          <PinkPanel className="mb-8 border-[#ffd0d6] bg-[#fff4fa] p-8 text-center">
            <p className="mb-4 font-bold text-[#c44a5c]">{error}</p>
            <button
              type="button"
              onClick={() => fetchRoutine(budget)}
              className="inline-flex items-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-5 py-3 text-sm font-black text-white shadow-[5px_5px_0_#d95199] transition hover:-translate-y-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
          </PinkPanel>
        )}

        {routine && !loading && (
          <PinkPanel className="p-6 md:p-8">
            <div className="mb-8 flex flex-col gap-3 text-center md:flex-row md:items-center md:justify-between md:text-left">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d95199]">
                  Pink pixel routine map
                </p>
                <h2 className="mt-1 text-3xl font-black text-[#4a2335]">Follow these 4 steps</h2>
              </div>

              <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-white bg-[#ffd6e8] px-4 py-2 text-sm font-black text-[#a7346f] shadow-[3px_3px_0_#f6b9d4] md:mx-0">
                <Heart className="h-4 w-4 fill-current" />
                {filledSteps} / 4 matched
              </div>
            </div>

            {ROUTINE_STEPS.map((stepMeta, index) => (
              <RoutineSlot
                key={stepMeta.key}
                stepMeta={stepMeta}
                product={routine[stepMeta.key]}
                stepNumber={index + 1}
                isLast={index === ROUTINE_STEPS.length - 1}
              />
            ))}
          </PinkPanel>
        )}

        {routine && !loading && (
          <PinkPanel className="mt-8 p-6">
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d95199]">
                  Routine summary
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#4a2335]">
                  Your routine is ready 💗
                </h3>
                <p className="mt-1 text-sm font-bold text-[#70435b]">
                  {filledSteps} of 4 steps filled
                  {totalCost > 0 && (
                    <span className="ml-2 font-black text-[#d95199]">
                      — Total: ${totalCost.toFixed(2)}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchRoutine(budget)}
                  className="inline-flex items-center gap-2 rounded-full border-4 border-white bg-white px-5 py-3 text-sm font-black text-[#d95199] shadow-[5px_5px_0_#f6b9d4] transition hover:-translate-y-1 hover:bg-[#fff4fa]"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>

                <Link
                  to="/results"
                  className="inline-flex items-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-5 py-3 text-sm font-black text-white no-underline shadow-[5px_5px_0_#d95199] transition hover:-translate-y-1 hover:bg-[#e94c99]"
                >
                  All Results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </PinkPanel>
        )}

        {routine && !loading && (
          <PinkPanel className="mt-8 p-6 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border-2 border-white bg-[#ffd6e8] text-[#d95199] shadow-[3px_3px_0_#f6b9d4]">
              <Wand2 className="h-6 w-6" />
            </div>

            <p className="mb-4 text-xl font-black text-[#4a2335]">Quick Tips</p>

            <div className="mx-auto grid max-w-3xl gap-3 text-left sm:grid-cols-2">
              {[
                'Apply products from thinnest to thickest consistency.',
                'Wait 30–60 seconds between layers for better absorption.',
                'Always finish with SPF 30+ in the morning.',
                'Consistency beats perfection — try it for 4–6 weeks.',
              ].map((tip) => (
                <p
                  key={tip}
                  className="rounded-2xl border-2 border-white bg-[#fff4fa] px-4 py-3 text-sm font-bold leading-6 text-[#70435b] shadow-[3px_3px_0_#ffd6e8]"
                >
                  ♡ {tip}
                </p>
              ))}
            </div>
          </PinkPanel>
        )}
      </div>
    </main>
  )
}
