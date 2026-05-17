import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#ffc0dd] text-[#4a2335] font-sans">
      <Header />

      <main className="relative flex-1 w-full overflow-hidden">
        {/* Pink pixel background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.32) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Soft glow circles */}
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-[#ff8fca]/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-white/20 blur-3xl" />

        {/* Cute floating shapes */}
        <div className="pointer-events-none absolute left-[10%] top-24 text-6xl opacity-30">
          ✦
        </div>
        <div className="pointer-events-none absolute right-[12%] top-36 text-6xl opacity-40">
          🌸
        </div>
        <div className="pointer-events-none absolute left-[18%] bottom-20 text-6xl opacity-35">
          💗
        </div>

        <div className="relative z-10">
          {children || <Outlet />}
        </div>
      </main>

      <Footer />
    </div>
  )
}