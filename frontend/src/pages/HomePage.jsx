import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Droplets,
  FlaskConical,
  Heart,
  Leaf,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'

const skincareGif = '/gif/gif1.gif'

// ── Skincare 101 data ───────────────────────────────────────────────────────

const routineSteps = [
  {
    number: '01',
    title: 'Cleanse',
    icon: Droplets,
    when: 'AM & PM',
    text: 'Wash away makeup, sunscreen and the day. A gentle cleanser is the base of every routine.',
    bg: '#ffe1ee',
  },
  {
    number: '02',
    title: 'Treat',
    icon: FlaskConical,
    when: 'AM or PM',
    text: 'Serums target what your skin needs hydration, brightening, calming or smoothing.',
    bg: '#ffd6e8',
  },
  {
    number: '03',
    title: 'Moisturise',
    icon: Heart,
    when: 'AM & PM',
    text: 'Lock everything in. Hydrated skin looks plump, soft and naturally glowy all day.',
    bg: '#ffc1db',
  },
  {
    number: '04',
    title: 'Protect',
    icon: Sun,
    when: 'AM only',
    text: 'SPF 30+ every morning. The single best step for keeping skin healthy long-term.',
    bg: '#ffb3d1',
  },
]

const ingredientCards = [
  {
    emoji: '💧',
    name: 'Hyaluronic Acid',
    job: 'Hydration',
    text: 'Holds up to 1000× its weight in water. Plumps tired, thirsty skin.',
  },
  {
    emoji: '🍊',
    name: 'Vitamin C',
    job: 'Brightening',
    text: 'Evens tone, fades dark spots and adds that healthy lit-from-within glow.',
  },
  {
    emoji: '🌙',
    name: 'Niacinamide',
    job: 'Calming',
    text: 'Soothes redness, minimises pores and balances oily or sensitive skin.',
  },
  {
    emoji: '✨',
    name: 'Retinol',
    job: 'Smoothing',
    text: 'A nighttime hero that refines texture and softens fine lines over time.',
  },
]

// ── Utility components ──────────────────────────────────────────────────────

function CuteImage({ src, alt, fallback = '🌸', className = '', imgClassName = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`grid place-items-center bg-[#fff2f8] ${className}`}>
        <span className="text-5xl drop-shadow-sm">{fallback}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${className} ${imgClassName}`}
    />
  )
}

function Scallop({ position = 'top', color = '#ffd6e8' }) {
  const isTop = position === 'top'

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 h-9 ${isTop ? 'top-0' : 'bottom-0'}`}
      style={{
        backgroundImage: isTop
          ? `radial-gradient(circle at 32px -6px, ${color} 30px, transparent 31px)`
          : `radial-gradient(circle at 32px 42px, ${color} 30px, transparent 31px)`,
        backgroundSize: '64px 36px',
      }}
    />
  )
}

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

function PinkSection({ children, className = '', scallop = false, id }) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden bg-[#ffc0dd] px-5 py-12 md:px-8 ${className}`}
    >
      <PixelGrid />
      {scallop && <Scallop position="top" color="#ffd6e8" />}
      <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
    </section>
  )
}

function HomepageBottomScallop() {
  return (
    <div className="relative -mt-px h-12 overflow-hidden bg-[#ffc0dd]">
      <PixelGrid />
      <Scallop position="bottom" color="#ffd6e8" />
    </div>
  )
}

function SectionEyebrow({ children, light = false }) {
  return (
    <p
      className={`font-black uppercase tracking-[0.25em] ${
        light ? 'text-white drop-shadow-sm' : 'text-[#d95199]'
      }`}
    >
      {children}
    </p>
  )
}

function SectionHeading({ children, light = false }) {
  return (
    <h2
      className={`mx-auto mt-3 max-w-3xl text-4xl font-black md:text-5xl ${
        light
          ? 'text-white drop-shadow-[3px_3px_0_#df79aa]'
          : 'text-[#4a2335]'
      }`}
    >
      {children}
    </h2>
  )
}

// ── GIF Showcase (now its own headlining moment) ────────────────────────────

function GifShowcase() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr]">
      {/* The GIF, big and proud */}
      <div className="relative">
        {/* Floating pixel stickers */}
        <div className="pointer-events-none absolute -left-4 -top-4 z-20 grid h-14 w-14 place-items-center rounded-2xl border-4 border-white bg-[#f064a8] text-2xl text-white shadow-[4px_4px_0_#b73578] rotate-[-8deg]">
          ✨
        </div>
        <div className="pointer-events-none absolute -right-3 top-10 z-20 hidden h-12 w-12 place-items-center rounded-2xl border-4 border-white bg-white text-2xl shadow-[4px_4px_0_#f6b9d4] rotate-[10deg] md:grid">
          🎀
        </div>
        <div className="pointer-events-none absolute -bottom-4 left-12 z-20 grid h-14 w-14 place-items-center rounded-2xl border-4 border-white bg-[#ffd6e8] text-2xl shadow-[4px_4px_0_#f6b9d4] rotate-[6deg]">
          🌸
        </div>

        <div className="rounded-[3rem] border-[7px] border-white bg-white p-4 shadow-[14px_14px_0_#e48ab8]">
          <div className="flex items-center gap-2 rounded-t-[2.25rem] bg-[#f064a8] px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-white" />
            <span className="h-3 w-3 rounded-full bg-white" />
            <span className="h-3 w-3 rounded-full bg-white" />
            <p className="ml-auto text-[10px] font-black uppercase tracking-[0.28em] text-white">
              Daily glow ✿ with PureGlow
            </p>
          </div>

          <div className="overflow-hidden rounded-b-[2.25rem] bg-[#fff4fa]">
            <CuteImage
              src={skincareGif}
              alt="PureGlow skincare animation"
              fallback="🧴"
              className="mx-auto max-h-[500px] w-full object-contain"
              imgClassName="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Companion text */}
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/85 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#d95199] shadow-[4px_4px_0_#f69bc4]">
          <Sparkles size={14} fill="currentColor" />
          See it in action
        </div>

        <h2 className="text-4xl font-black leading-[0.95] tracking-tight text-[#4a2335] md:text-5xl">
          A whole routine in a
          <span className="block text-[#d95199] drop-shadow-[2px_2px_0_#fff]">
            pretty moment.
          </span>
        </h2>

        <p className="mt-4 max-w-md text-base font-semibold leading-7 text-[#70435b]">
          Watch how PureGlow builds a soft, easy-to-follow routine cleansers, serums,
          moisturisers and makeup tones that feel chosen just for you.
        </p>

        <ul className="mt-4 space-y-3">
          {[
            'Personalised in under 60 seconds',
            'Skincare + makeup in one place',
            'No account, no spam, no pressure',
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-3 rounded-2xl border-2 border-white bg-white/80 px-4 py-3 text-sm font-bold text-[#70435b] shadow-[4px_4px_0_#ffd6e8]"
            >
              <span className="mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-md bg-[#f064a8] text-white">
                <Heart className="h-3 w-3" fill="currentColor" />
              </span>
              {line}
            </li>
          ))}
        </ul>

        <Link
          to="/quiz"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-7 py-3 font-black text-white shadow-[6px_6px_0_#d95199] transition hover:-translate-y-1 hover:bg-[#e94c99]"
        >
          Take the Skin Quiz
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}

// ============================================================================
// HomePage
// ============================================================================

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#ffc0dd] text-[#4a2335]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <PinkSection className="pb-10 pt-10 md:pb-12 md:pt-16" scallop>
        <div className="pointer-events-none absolute left-8 top-32 text-8xl opacity-30 blur-[1px]">✦</div>
        <div className="pointer-events-none absolute right-12 top-36 text-7xl opacity-80">✿</div>
        <div className="pointer-events-none absolute bottom-16 left-16 text-8xl opacity-70">🌼</div>
        <div className="pointer-events-none absolute bottom-24 right-[14%] text-7xl opacity-80">💗</div>

        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/85 px-5 py-2 text-sm font-black uppercase tracking-[0.18em] text-[#d95199] shadow-[4px_4px_0_#f69bc4]">
            <Sparkles size={16} fill="currentColor" />
            Self-care AND Get Glow
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[4px_4px_0_#e686b6] md:text-7xl">
            PureGlow
            <span className="block text-[#fff5fb]">for your soft glow.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-center text-lg font-semibold leading-8 text-[#6a3d55]">
            PureGlow helps you discover skincare routines and makeup ideas that match your
            skin type, concerns, skin tone and undertone all in a cute pink pixel style.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-[#f064a8] px-8 py-4 font-black text-white shadow-[6px_6px_0_#d95199] transition hover:-translate-y-1 hover:bg-[#e94c99]"
            >
              Find My Routine
              <ArrowRight size={19} />
            </Link>

            <a
              href="#preview"
              className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-white bg-white px-8 py-4 font-black text-[#d95199] shadow-[6px_6px_0_#f69bc4] transition hover:-translate-y-1 hover:bg-[#fff4fa]"
            >
              See It Glow
              <Sparkles size={19} />
            </a>
          </div>

          {/* Trust strip */}
          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-3">
            {[
              { icon: '⏱', label: '60-second quiz' },
              { icon: '🔒', label: 'No account needed' },
              { icon: '💗', label: 'Made with care' },
            ].map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#a7346f] shadow-[3px_3px_0_#f6b9d4]"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </PinkSection>

      {/* ── GIF SHOWCASE — now its own headline moment ──────────────────── */}
      <PinkSection id="preview" className="py-12">
        <div className="mb-8 text-center">
          <SectionEyebrow light>Watch the glow</SectionEyebrow>
          <SectionHeading light>Pretty preview, real routine.</SectionHeading>
        </div>

        <div className="rounded-[3rem] border-4 border-white bg-white/80 p-5 shadow-[12px_12px_0_#e48ab8] md:p-8">
          <GifShowcase />
        </div>
      </PinkSection>

      {/* ── Skincare 101: Why a routine matters ────────────────────────── */}
      <PinkSection className="py-12">
        <div className="mb-8 text-center">
          <SectionEyebrow light>Skincare 101</SectionEyebrow>
          <SectionHeading light>Why a routine actually matters.</SectionHeading>
          <p className="mx-auto mt-3 max-w-2xl rounded-3xl border-2 border-white bg-white/80 px-6 py-4 text-center font-semibold leading-7 text-[#70435b] shadow-[5px_5px_0_#f6b9d4]">
            Your skin is your biggest organ and it’s constantly renewing itself. A simple,
            consistent routine helps it stay calm, hydrated and protected, no matter your age,
            skin type or budget.
          </p>
        </div>

        {/* Three reason cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Leaf,
              title: 'It’s about kindness, not perfection',
              text: 'Good skincare is gentle and consistent. You don’t need 12 products — just the right few.',
            },
            {
              icon: ShieldCheck,
              title: 'Daily protection matters most',
              text: 'Sunscreen, hydration and cleansing prevent more skin damage than any luxury serum.',
            },
            {
              icon: Moon,
              title: 'Skin renews at night',
              text: 'Your evening routine sets up repair while you sleep. Even 3 minutes is enough.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-[2rem] border-4 border-white bg-white p-6 shadow-[7px_7px_0_#f6b9d4] transition hover:-translate-y-1"
            >
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#ffd6e8] text-[#d95199] shadow-[3px_3px_0_#f6b9d4]">
                <Icon size={26} />
              </div>
              <h3 className="text-xl font-black text-[#4a2335]">{title}</h3>
              <p className="mt-2 leading-7 text-[#72445d]">{text}</p>
            </div>
          ))}
        </div>
      </PinkSection>

      {/* ── The 4-Step Routine Order ────────────────────────────────────── */}
      <PinkSection className="py-12">
        <div className="mb-8 text-center">
          <SectionEyebrow light>The order matters</SectionEyebrow>
          <SectionHeading light>Build your routine in 4 cute steps.</SectionHeading>
          <p className="mx-auto mt-3 max-w-2xl rounded-3xl border-2 border-white bg-white/80 px-6 py-4 text-center font-semibold leading-7 text-[#70435b] shadow-[5px_5px_0_#f6b9d4]">
            Apply products from thinnest to thickest. Water-based first, oil-based last, sunscreen
            always at the end of your morning routine.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {routineSteps.map((step) => {
            const Icon = step.icon
            return (
              <article
                key={step.number}
                className="relative rounded-[2rem] border-4 border-white p-6 shadow-[7px_7px_0_#f69bc4] transition hover:-translate-y-2"
                style={{ backgroundColor: step.bg }}
              >
                <span className="absolute -top-4 left-5 rounded-full border-2 border-white bg-[#f064a8] px-3 py-1 text-xs font-black tracking-widest text-white shadow-[3px_3px_0_#b73578]">
                  STEP {step.number}
                </span>

                <div className="mt-3 grid h-14 w-14 place-items-center rounded-2xl border-2 border-white bg-white text-[#d95199] shadow-[3px_3px_0_#f6b9d4]">
                  <Icon size={26} />
                </div>

                <h3 className="mt-4 text-2xl font-black text-[#4a2335]">{step.title}</h3>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#d95199]">
                  {step.when}
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#72445d]">{step.text}</p>
              </article>
            )
          })}
        </div>
      </PinkSection>

      {/* ── Ingredient Glossary ─────────────────────────────────────────── */}
      <PinkSection className="py-12">
        <div className="mb-8 text-center">
          <SectionEyebrow light>Meet the heroes</SectionEyebrow>
          <SectionHeading light>The ingredients worth knowing.</SectionHeading>
          <p className="mx-auto mt-3 max-w-2xl rounded-3xl border-2 border-white bg-white/80 px-6 py-4 text-center font-semibold leading-7 text-[#70435b] shadow-[5px_5px_0_#f6b9d4]">
            A quick cheat sheet for the four ingredients you’ll see again and again on bottles.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ingredientCards.map((item) => (
            <article
              key={item.name}
              className="rounded-[2rem] border-4 border-white bg-white p-6 shadow-[7px_7px_0_#f6b9d4] transition hover:-translate-y-1"
            >
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#ffd6e8] text-3xl shadow-[3px_3px_0_#f6b9d4]">
                {item.emoji}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d95199]">
                {item.job}
              </p>
              <h3 className="mt-1 text-xl font-black text-[#4a2335]">{item.name}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#72445d]">{item.text}</p>
            </article>
          ))}
        </div>
      </PinkSection>

      <HomepageBottomScallop />
    </main>
  )
}
