/**
 * PureGlow - Product Card
 * =======================
 * Pink pixel product recommendation card.
 */

import { Star, HelpCircle, ExternalLink, Sparkles } from 'lucide-react'

export default function ProductCard({ product, rank, onExplain, type = 'skincare' }) {
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
  const scorePercent = Math.round(relevance_score * 100)

  return (
    <article
      className="
        group relative flex min-h-[360px] flex-col overflow-hidden
        rounded-[2rem] border-4 border-white bg-[#fff7fb]
        p-5 text-[#4a2335]
        shadow-[8px_8px_0_#e48ab8]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[11px_11px_0_#d95199]
      "
    >
      {/* Soft pixel background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,192,221,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,192,221,.35) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />

      {/* Rank badge */}
      {rank && (
        <div
          className="
            absolute -left-2 -top-2 z-20 grid h-11 w-11 place-items-center
            rounded-2xl border-4 border-white bg-[#f064a8]
            text-sm font-black text-white
            shadow-[4px_4px_0_#b73578]
            rotate-[-8deg]
          "
        >
          #{rank}
        </div>
      )}

      {/* Decorative icon */}
      <div
        className="
          absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center
          rounded-2xl border-2 border-white bg-[#ffd6e8]
          text-[#f064a8] shadow-[3px_3px_0_#f6b9d4]
        "
      >
        <Sparkles size={18} fill="currentColor" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Top image / swatch area */}
        <div
          className="
            mb-5 grid min-h-[125px] place-items-center
            rounded-[1.5rem] border-4 border-[#ffd1e4]
            bg-gradient-to-br from-[#fff0f7] via-[#ffe1ee] to-[#fff8fb]
            shadow-[4px_4px_0_#ffd6e8]
          "
        >
          {hex_color ? (
            <div className="text-center">
              <div
                className="
                  mx-auto h-20 w-20 rounded-full border-4 border-white
                  shadow-[5px_5px_0_#f6b9d4]
                "
                style={{ backgroundColor: hex_color }}
                title={color_name || hex_color}
              />
              {color_name && (
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#d95199]">
                  {color_name}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl drop-shadow-sm">🧴</div>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-[#d95199]">
                Glow Pick
              </p>
            </div>
          )}
        </div>

        {/* Category */}
        {displayCategory && (
          <span
            className="
              mb-3 w-fit rounded-full bg-[#ffd6e8]
              px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]
              text-[#d95199]
            "
          >
            {displayCategory}
          </span>
        )}

        {/* Product name */}
        <h3 className="text-lg font-black leading-snug text-[#4a2335]">
          {name}
        </h3>

        {/* Brand */}
        {brand && (
          <p className="mt-2 text-sm font-semibold text-[#70435b]">
            by <span className="font-black text-[#4a2335]">{brand}</span>
          </p>
        )}

        {/* Shade name */}
        {color_name && (
          <p className="mt-2 text-xs font-semibold text-[#70435b]">
            Shade: <span className="font-black text-[#d95199]">{color_name}</span>
          </p>
        )}

        <div className="flex-1" />

        {/* Price + rating */}
        <div
          className="
            mt-5 flex items-center justify-between gap-3
            rounded-2xl border-2 border-white bg-white/80
            px-4 py-3 shadow-[3px_3px_0_#ffe1ee]
          "
        >
          {price != null && !isNaN(price) ? (
            <span className="text-xl font-black text-[#4a2335]">
              ${Number(price).toFixed(2)}
            </span>
          ) : (
            <span className="text-sm font-bold text-[#70435b]">Price N/A</span>
          )}

          {rating != null && !isNaN(rating) && (
            <div className="flex items-center gap-1 rounded-full bg-[#fff0c8] px-3 py-1">
              <Star className="h-4 w-4 fill-[#f6a800] text-[#f6a800]" />
              <span className="text-sm font-black text-[#4a2335]">
                {Number(rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Match score */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-black uppercase tracking-[0.16em] text-[#70435b]">
              Match score
            </span>
            <span className="font-black text-[#d95199]">{scorePercent}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full border-2 border-white bg-[#ffd6e8] shadow-[2px_2px_0_#f6b9d4]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f69bc4] to-[#f064a8] transition-all duration-700 ease-out"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center gap-2">
          {onExplain && (
            <button
              onClick={() => onExplain(product)}
              className="
                flex flex-1 items-center justify-center gap-1.5
                rounded-full border-2 border-white bg-[#ffd6e8]
                px-4 py-2.5 text-sm font-black text-[#d95199]
                shadow-[4px_4px_0_#f6b9d4]
                transition hover:-translate-y-0.5 hover:bg-[#ffe1ee]
              "
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
              className="
                flex items-center justify-center gap-1.5
                rounded-full border-2 border-white bg-[#f064a8]
                px-4 py-2.5 text-sm font-black text-white no-underline
                shadow-[4px_4px_0_#d95199]
                transition hover:-translate-y-0.5 hover:bg-[#e94c99]
              "
            >
              <ExternalLink className="h-4 w-4" />
              View
            </a>
          )}
        </div>
      </div>
    </article>
  )
}