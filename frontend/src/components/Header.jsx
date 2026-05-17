import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Menu, X } from 'lucide-react'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/quiz', label: 'Skin Quiz' },
    { to: '/results', label: 'Results' },
    { to: '/routine', label: 'Routine' },
  ]

  const isActive = (path) => location.pathname === path

  const brandFont = {
    fontFamily: '"Dynalight", cursive',
  }

  const cuteFont = {
    fontFamily: '"Coiny", system-ui',
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b-4 border-white bg-[#ffd3e5]/95 backdrop-blur-md transition-all duration-300 ${
        scrolled ? 'shadow-[0_8px_0_rgba(246,185,212,0.45)]' : 'shadow-none'
      }`}
    >
      <nav className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[76px] items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3 no-underline"
          >
            <div className="grid h-[58px] w-[58px] place-items-center overflow-hidden rounded-[1.35rem] border-[3px] border-white bg-white shadow-[4px_4px_0_#f6b9d4] transition duration-300 group-hover:-translate-y-0.5">
              <img
                src="/images/pureglow-mascot-header.png"
                alt="PureGlow AI"
                className="h-[50px] w-[50px] object-contain"
              />
            </div>

            <div className="hidden leading-tight sm:block">
              <p
                className="text-[43px] font-normal leading-none tracking-wide text-[#4a2335]"
                style={brandFont}
              >
                PureGlow
              </p>

              <p
                className="mt-1 text-[9px] font-normal uppercase tracking-[0.28em] text-[#d95199]"
                style={cuteFont}
              >
                beauty care
              </p>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-[3px] border-white bg-white/75 px-2 py-2 shadow-[4px_4px_0_#f6b9d4] lg:flex">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={cuteFont}
                className={`rounded-full px-5 py-2.5 text-sm font-normal transition no-underline ${
                  isActive(to)
                    ? 'bg-[#ddd8ff] text-[#5c4b98] shadow-[3px_3px_0_#bdb7ff]'
                    : 'text-[#77445f] hover:bg-[#fff2f8] hover:text-[#d95199]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Get Started */}
          <Link
            to="/quiz"
            style={cuteFont}
            className="hidden items-center gap-2 rounded-full border-[3px] border-white bg-[#f064a8] px-6 py-3 text-sm font-normal text-white shadow-[4px_4px_0_#d95199] transition hover:-translate-y-0.5 lg:inline-flex"
          >
            <Heart className="h-4 w-4" fill="currentColor" />
            Get Started
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen((value) => !value)}
            className="grid h-12 w-12 place-items-center rounded-2xl border-[3px] border-white bg-white text-[#4a2335] shadow-[4px_4px_0_#f6b9d4] lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="pb-5 lg:hidden">
            <div className="grid gap-2 rounded-[2rem] border-[3px] border-white bg-white/90 p-3 shadow-[5px_5px_0_#f6b9d4]">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={cuteFont}
                  className={`rounded-2xl px-4 py-3 text-sm font-normal no-underline ${
                    isActive(to)
                      ? 'bg-[#ddd8ff] text-[#5c4b98]'
                      : 'text-[#77445f] hover:bg-[#fff2f8]'
                  }`}
                >
                  {label}
                </Link>
              ))}

              <Link
                to="/quiz"
                style={cuteFont}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#f064a8] px-4 py-3 text-sm font-normal text-white no-underline"
              >
                <Heart className="h-4 w-4" fill="currentColor" />
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}