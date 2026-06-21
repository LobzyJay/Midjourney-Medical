/**
 * No menu — a single floating hairline wordmark, top-left, Swiss style.
 * (HANDOFF §6.5)
 */
export function Nav() {
  return (
    <header className="fixed left-0 top-0 z-40 w-full mix-blend-difference">
      <div
        className="flex items-center"
        style={{ paddingInline: 'var(--margin)', paddingBlock: '20px' }}
      >
        <a
          href="#void"
          className="label transition-opacity duration-300 ease-out [@media(hover:hover)]:hover:opacity-70"
          style={{ color: 'var(--cream)' }}
        >
          Midjourney&nbsp;Medical
        </a>
      </div>
    </header>
  )
}
