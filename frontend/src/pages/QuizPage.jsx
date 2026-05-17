/**
 * PureGlow AI - Quiz Page
 * ========================
 * Pink pixel boutique style to match the Home Page.
 */

import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Heart,
  Sparkles,
  Wand2,
} from 'lucide-react'
import {
  useQuiz,
  QUIZ_STEPS,
  TOTAL_STEPS,
  SKIN_TYPE_OPTIONS,
  CONCERN_OPTIONS,
  UNDERTONE_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '../context/QuizContext'
import { getRecommendations } from '../api/client'

// ============================================================================
// Decorative theme helpers
// ============================================================================

function PixelGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,.30) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.30) 1px, transparent 1px)',
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

function PageDecoration() {
  return (
    <>
      <div className="pointer-events-none absolute left-8 top-36 text-7xl text-[#b77896]/45 animate-float">
        ✦
      </div>
      <div className="pointer-events-none absolute right-12 top-40 text-6xl text-[#67384f]">
        ✿
      </div>
      <div className="pointer-events-none absolute bottom-16 left-10 text-7xl animate-float">
        🌸
      </div>
      <div className="pointer-events-none absolute bottom-24 right-12 hidden text-7xl md:block animate-float">
        🎀
      </div>
    </>
  )
}

const optionBase =
  'group w-full rounded-[2rem] border-[3px] p-5 text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f064a8]'

function optionClass(selected) {
  return `${optionBase} ${
    selected
      ? 'border-[#f064a8] bg-[#fff0f7] shadow-[7px_7px_0_#f6b9d4] -translate-y-1'
      : 'border-white bg-white/90 shadow-[5px_5px_0_#ffd6e8] hover:-translate-y-1 hover:border-[#f6a8cc] hover:bg-[#fff8fb] hover:shadow-[7px_7px_0_#f6b9d4]'
  }`
}

function selectedLineClass(selected) {
  return `mt-4 h-1.5 w-full rounded-full transition-all duration-300 ${
    selected ? 'bg-[#f064a8]' : 'bg-[#ffd6e8]'
  }`
}

// ============================================================================
// Step 0 — Skin Type
// ============================================================================

function SkinTypeStep() {
  const { state, dispatch } = useQuiz()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SKIN_TYPE_OPTIONS.map((option) => {
        const selected = state.skin_type === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => dispatch({ type: 'SET_SKIN_TYPE', payload: option.value })}
            className={optionClass(selected)}
          >
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl border-2 border-white bg-[#ffd6e8] text-3xl shadow-[3px_3px_0_#f6b9d4]">
                {option.emoji}
              </span>

              <div>
                <p className="mb-1 text-lg font-black text-[#4a2335]">
                  {option.label}
                </p>
                <p className="text-sm font-medium leading-6 text-[#70435b]">
                  {option.description}
                </p>
              </div>
            </div>

            <div className={selectedLineClass(selected)} />
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Step 1 — Concerns
// ============================================================================

function ConcernsStep() {
  const { state, dispatch } = useQuiz()

  return (
    <div>
      <p className="mb-5 rounded-2xl border-2 border-white bg-white/80 px-5 py-3 text-center text-sm font-semibold text-[#70435b] shadow-[4px_4px_0_#ffd6e8]">
        Select as many as you like. You can also skip this step if none apply.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONCERN_OPTIONS.map((option) => {
          const selected = state.concerns.includes(option.value)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_CONCERN', payload: option.value })}
              className={`rounded-[1.5rem] border-[3px] px-4 py-4 text-left transition-all duration-300 ${
                selected
                  ? 'border-[#f064a8] bg-[#fff0f7] shadow-[5px_5px_0_#f6b9d4] -translate-y-1'
                  : 'border-white bg-white/90 shadow-[4px_4px_0_#ffd6e8] hover:-translate-y-1 hover:border-[#f6a8cc] hover:bg-[#fff8fb]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ffd6e8] text-xl shadow-inner">
                  {option.emoji}
                </span>
                <span
                  className={`text-sm font-black ${
                    selected ? 'text-[#d95199]' : 'text-[#4a2335]'
                  }`}
                >
                  {option.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {state.concerns.length > 0 && (
        <div className="mt-6 rounded-[1.5rem] border-2 border-white bg-white/80 p-4 shadow-[4px_4px_0_#ffd6e8] animate-fade-in">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#d95199]">
            Selected concerns
          </p>
          <div className="flex flex-wrap gap-2">
            {state.concerns.map((c) => {
              const opt = CONCERN_OPTIONS.find((o) => o.value === c)

              return (
                <span
                  key={c}
                  className="rounded-full bg-[#ffd6e8] px-4 py-2 text-xs font-black text-[#a7346f]"
                >
                  {opt?.emoji} {opt?.label}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Step 2 — Undertone
// ============================================================================

function UndertoneStep() {
  const { state, dispatch } = useQuiz()

  return (
    <div className="grid grid-cols-1 gap-4">
      {UNDERTONE_OPTIONS.map((option) => {
        const selected = state.undertone === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => dispatch({ type: 'SET_UNDERTONE', payload: option.value })}
            className={optionClass(selected)}
          >
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl border-2 border-white bg-[#ffd6e8] text-3xl shadow-[3px_3px_0_#f6b9d4]">
                {option.emoji}
              </span>

              <div className="flex-1">
                <p className="mb-1 text-lg font-black text-[#4a2335]">
                  {option.label}
                </p>
                <p className="mb-4 text-sm font-medium leading-6 text-[#70435b]">
                  {option.description}
                </p>

                <div className="space-y-2 rounded-2xl bg-white/70 p-4">
                  {option.signs.map((sign, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm font-medium text-[#70435b]">
                      <span
                        className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${
                          selected ? 'bg-[#f064a8]' : 'bg-[#f6b9d4]'
                        }`}
                      />
                      <span>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={selectedLineClass(selected)} />
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Step 3 — Skin Tone
// ============================================================================

function SkinToneStep() {
  const { state, dispatch } = useQuiz()

  return (
    <div>
      <p className="mb-6 rounded-2xl border-2 border-white bg-white/80 px-5 py-3 text-center text-sm font-semibold leading-6 text-[#70435b] shadow-[4px_4px_0_#ffd6e8]">
        Pick the shade closest to your natural skin tone. This is optional, but it helps PureGlow suggest better makeup shades.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {SKIN_TONE_OPTIONS.map((option) => {
          const selected = state.skin_tone === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => dispatch({ type: 'SET_SKIN_TONE', payload: option.value })}
              className={`flex flex-col items-center gap-3 rounded-[1.75rem] border-[3px] p-4 transition-all duration-300 ${
                selected
                  ? 'border-[#f064a8] bg-[#fff0f7] shadow-[5px_5px_0_#f6b9d4] -translate-y-1'
                  : 'border-white bg-white/90 shadow-[4px_4px_0_#ffd6e8] hover:-translate-y-1 hover:border-[#f6a8cc] hover:bg-[#fff8fb]'
              }`}
            >
              <div className="rounded-full border-[5px] border-white bg-white p-1 shadow-inner">
                <div
                  className={`h-14 w-14 rounded-full transition-transform ${
                    selected ? 'scale-110 ring-4 ring-[#f6b9d4]' : ''
                  }`}
                  style={{ backgroundColor: option.color }}
                />
              </div>

              <span
                className={`text-center text-sm font-black ${
                  selected ? 'text-[#d95199]' : 'text-[#4a2335]'
                }`}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-[#70435b]">
        You can skip this step — just click <span className="font-black text-[#d95199]">Get My Results</span>.
      </p>
    </div>
  )
}

// ============================================================================
// Step renderer
// ============================================================================

function CurrentStep({ step }) {
  switch (step) {
    case 0:
      return <SkinTypeStep />
    case 1:
      return <ConcernsStep />
    case 2:
      return <UndertoneStep />
    case 3:
      return <SkinToneStep />
    default:
      return null
  }
}

// ============================================================================
// Progress bar
// ============================================================================

function ProgressBar({ current, total }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: total }, (_, i) => {
          const active = i === current
          const complete = i < current
          const stepLabel = QUIZ_STEPS[i]?.id?.replace('_', ' ') || `Step ${i + 1}`

          return (
            <div
              key={i}
              className={`rounded-[1.5rem] border-[3px] px-3 py-3 text-center transition-all duration-300 ${
                complete || active
                  ? 'border-white bg-[#f064a8] text-white shadow-[4px_4px_0_#d95199]'
                  : 'border-white bg-white/80 text-[#70435b] shadow-[4px_4px_0_#ffd6e8]'
              }`}
            >
              <div className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-black text-[#d95199]">
                {complete ? '✓' : i + 1}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em]">
                {stepLabel}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Main QuizPage
// ============================================================================

export default function QuizPage() {
  const {
    state,
    dispatch,
    canGoNext,
    canGoBack,
    isLastStep,
  } = useQuiz()
  const navigate = useNavigate()

  const currentStepData = QUIZ_STEPS[state.step]

  async function handleSubmit() {
    dispatch({ type: 'COMPLETE_QUIZ' })
    dispatch({ type: 'SET_LOADING' })

    const profile = {
      skin_type: state.skin_type,
      concerns: state.concerns.length > 0 ? state.concerns : undefined,
      undertone: state.undertone || undefined,
      skin_tone: state.skin_tone || undefined,
      top_n: 10,
    }

    const result = await getRecommendations(profile)

    if (result.success) {
      dispatch({ type: 'SET_RESULTS', payload: result.data })
      navigate('/results')
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.message })
    }
  }

  function handleNext() {
    if (isLastStep) {
      handleSubmit()
    } else {
      dispatch({ type: 'NEXT_STEP' })
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#ffc0dd] px-4 py-14 md:px-8 md:py-20">
      <PixelGrid />
      <Scallop position="top" color="#ffd6e8" />
      <Scallop position="bottom" color="#ffd6e8" />
      <PageDecoration />

      <div className="relative z-10 mx-auto max-w-5xl animate-fade-in">
        <section className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/85 px-5 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#d95199] shadow-[4px_4px_0_#f6b9d4]">
            <Sparkles size={15} fill="currentColor" />
            PureGlow Skin Quiz
            <Sparkles size={15} fill="currentColor" />
          </div>

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[4px_4px_0_#e48ab8] md:text-7xl">
            Build your soft glow routine.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-base font-semibold leading-8 text-[#70435b] md:text-lg">
            Answer a few cute questions and PureGlow will match your skin type, concerns,
            undertone and skin tone with gentle skincare and makeup ideas.
          </p>
        </section>

        <section className="mx-auto max-w-4xl">
          <ProgressBar current={state.step} total={TOTAL_STEPS} />

          <div className="overflow-hidden rounded-[2.75rem] border-[7px] border-white bg-white shadow-[14px_14px_0_#e48ab8]">
            <div className="flex items-center gap-2 bg-[#f064a8] px-6 py-4">
              <span className="h-3 w-3 rounded-full bg-white" />
              <span className="h-3 w-3 rounded-full bg-white" />
              <span className="h-3 w-3 rounded-full bg-white" />
              <p className="ml-auto hidden text-[10px] font-black uppercase tracking-[0.32em] text-white sm:block">
                Pink pixel skincare
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#fff8fb] via-[#ffe1ee] to-[#fff0f7] p-5 sm:p-8 md:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border-2 border-white bg-[#ffd6e8] text-[#d95199] shadow-[4px_4px_0_#f6b9d4]">
                  <Wand2 size={26} />
                </div>

                <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-[#d95199]">
                  Step {state.step + 1} of {TOTAL_STEPS}
                </p>

                <h2 className="text-3xl font-black tracking-tight text-[#4a2335] md:text-4xl">
                  {currentStepData.title}
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold leading-7 text-[#70435b] md:text-base">
                  {currentStepData.subtitle}
                </p>
              </div>

              <div key={state.step} className="animate-fade-in">
                <CurrentStep step={state.step} />
              </div>

              {state.error && (
                <div className="mt-6 flex items-start gap-3 rounded-[1.5rem] border-2 border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[4px_4px_0_#fecaca] animate-fade-in">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-black">Something went wrong</p>
                    <p className="mt-1 font-medium text-red-600">{state.error}</p>
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-col gap-4 border-t-2 border-white pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'PREV_STEP' })}
                  disabled={!canGoBack}
                  className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-white px-6 py-3 text-sm font-black transition-all duration-300 ${
                    canGoBack
                      ? 'bg-white/90 text-[#70435b] shadow-[4px_4px_0_#ffd6e8] hover:-translate-y-0.5 hover:text-[#d95199]'
                      : 'cursor-not-allowed bg-white/50 text-[#d9a7bd]'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <div className="hidden items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#d95199] sm:flex">
                  <Heart className="h-4 w-4" fill="currentColor" />
                  PureGlow Match
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext || state.loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-white bg-[#f064a8] px-7 py-3 text-sm font-black text-white shadow-[5px_5px_0_#d95199] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e9559c] disabled:cursor-not-allowed disabled:bg-[#f6b9d4] disabled:shadow-none"
                >
                  {state.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analysing...
                    </>
                  ) : isLastStep ? (
                    <>
                      Get My Results
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-7 max-w-2xl rounded-full border-2 border-white bg-white/75 px-6 py-3 text-center text-xs font-bold text-[#70435b] shadow-[4px_4px_0_#ffd6e8]">
            No account needed. Your quiz answers are only used to create your PureGlow recommendation.
          </p>
        </section>
      </div>
    </main>
  )
}
