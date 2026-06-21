import type { ReactNode } from 'react'

/**
 * Swiss grid container — centered max-width 1440, mathematical margins,
 * 12 / 6 / 4 column grid (desktop / tablet / mobile). Flush-left by default.
 * Children opt into columns with Tailwind col-span-* on the inner grid.
 */
export function Container({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'header' | 'footer'
}) {
  return (
    <Tag
      className={className}
      style={{
        maxWidth: 'var(--max)',
        marginInline: 'auto',
        paddingInline: 'var(--margin)',
      }}
    >
      {children}
    </Tag>
  )
}

/**
 * The 12/6/4 column grid itself. Drop Grid inside a Container (or use
 * Container's padding) and place children with col-span utilities.
 */
export function Grid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 ${className}`}
      style={{ columnGap: 'var(--gutter)' }}
    >
      {children}
    </div>
  )
}
