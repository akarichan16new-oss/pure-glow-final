import { Link } from 'react-router-dom'
import { Heart, Sparkles, ShieldCheck, Wand2 } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/quiz', label: 'Skin Quiz' },
    { to: '/results', label: 'Results' },
    { to: '/routine', label: 'Routine' },
  ]

  return (
    <footer className="mt-auto border-t-2 border-white bg-[#ffd1e6] text-[#3f1f2f]">
      {/* Main flat footer */}
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[1.2fr_0.8fr_1.1fr] md:items-start">
        
        {/* Brand */}
        <div>
          <Link to="/" className="mb-3 flex items-center gap-3 no-underline">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border-2 border-white bg-[#e94f9b] text-white shadow-[3px_3px_0_#b73578]">
              <Sparkles className="h-4 w-4" />
            </div>

            <div>
              <h3 className="text-base font-black text-[#3f1f2f]">
                PureGlow Quiz
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9468f]">
                Pink Pixel Skincare
              </p>
            </div>
          </Link>

          <p className="max-w-sm text-xs font-semibold leading-6 text-[#6f3b55]">
            Personalised skincare and makeup suggestions based on your skin type,
            concerns, undertone and tone.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#d9468f]">
            Quick Links
          </h4>

          <nav className="flex flex-wrap gap-2 md:flex-col">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs font-black text-[#6f3b55] no-underline transition hover:text-[#d9468f]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Information */}
        <div>
          <h4 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#d9468f]">
            About
          </h4>

          <div className="space-y-2 text-xs font-semibold leading-6 text-[#6f3b55]">
            <p className="flex gap-2">
              <Wand2 className="mt-1 h-4 w-4 shrink-0 text-[#d9468f]" />
              Helps you build a simple beauty routine with skincare and makeup ideas.
            </p>

            <p className="flex gap-2">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#d9468f]" />
              No account needed. Your quiz answers are only used for recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Deep bottom bar */}
      <div className="border-t-2 border-white bg-[#d9468f] px-5 py-3 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-[11px] font-black sm:flex-row">
          <p>© {currentYear} PureGlow AI. All rights reserved.</p>

          <p className="flex items-center gap-1">
            Made with
            <Heart className="h-3.5 w-3.5 fill-white text-white" />
            for beautiful skin
          </p>
        </div>
      </div>
    </footer>
  )
}