/**
 * PureGlow AI - Scroll Reveal
 * =============================
 * Wraps children in an IntersectionObserver so they animate in
 * when scrolled into view. Portfolio-grade entrance animations.
 *
 * Usage:
 *   <ScrollReveal>             // default: fade-up
 *   <ScrollReveal animation="fade-left" delay={200}>
 *   <ScrollReveal animation="scale" stagger={true}>
 *
 * Available animations:
 *   fade-up, fade-down, fade-left, fade-right, scale, blur
 */

import { useEffect, useRef, useState } from 'react'

const ANIMATION_CLASSES = {
  'fade-up': {
    hidden: 'opacity-0 translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    hidden: 'opacity-0 -translate-y-8',
    visible: 'opacity-100 translate-y-0',
  },
  'fade-left': {
    hidden: 'opacity-0 translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'fade-right': {
    hidden: 'opacity-0 -translate-x-8',
    visible: 'opacity-100 translate-x-0',
  },
  'scale': {
    hidden: 'opacity-0 scale-95',
    visible: 'opacity-100 scale-100',
  },
  'blur': {
    hidden: 'opacity-0 blur-sm scale-98',
    visible: 'opacity-100 blur-0 scale-100',
  },
}

export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
  className = '',
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.unobserve(el)
  }, [threshold, once])

  const anim = ANIMATION_CLASSES[animation] || ANIMATION_CLASSES['fade-up']

  return (
    <div
      ref={ref}
      className={`
        transition-all ease-out
        ${isVisible ? anim.visible : anim.hidden}
        ${className}
      `}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Staggered grid: wraps multiple children with increasing delays.
 *
 * Usage:
 *   <StaggerGrid animation="fade-up" baseDelay={0} staggerDelay={100}>
 *     <Card /><Card /><Card />
 *   </StaggerGrid>
 */
export function StaggerGrid({
  children,
  animation = 'fade-up',
  baseDelay = 0,
  staggerDelay = 100,
  duration = 600,
  className = '',
}) {
  const items = Array.isArray(children) ? children : [children]

  return (
    <div className={className}>
      {items.map((child, i) => (
        <ScrollReveal
          key={i}
          animation={animation}
          delay={baseDelay + i * staggerDelay}
          duration={duration}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  )
}
