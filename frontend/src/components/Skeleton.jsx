/**
 * PureGlow AI - Skeleton Loaders
 * ================================
 * Pulse-animated placeholder shapes shown while content loads.
 * Makes the app feel fast and professional.
 *
 * Usage:
 *   <Skeleton className="h-6 w-48" />                   // text line
 *   <Skeleton className="h-40 w-full rounded-2xl" />    // card
 *   <ProductCardSkeleton />                              // full card
 *   <SkeletonGrid count={6} />                           // grid of cards
 */

export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-rose-100 via-rose-50
                  to-rose-100 bg-[length:200%_100%] rounded-lg ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex-1" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RoutineSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-6">
          <div className="flex flex-col items-center">
            <Skeleton className="w-12 h-12 rounded-full" />
            {i < 4 && <Skeleton className="w-0.5 h-16 mt-2" />}
          </div>
          <div className="flex-1">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-5 w-40 mb-3" />
            <div className="card space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Skeleton
