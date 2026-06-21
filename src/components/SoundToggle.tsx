import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * Ambient sound toggle — hairline, bottom-right, muted by default.
 * (HANDOFF §6.6). Wiring to an <audio> source lands with the spa/ambient pass;
 * for now it holds state and presents the control.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Mute ambient sound' : 'Play ambient sound'}
      onClick={() => setOn((v) => !v)}
      className="fixed bottom-0 right-0 z-40 flex items-center gap-2 transition-[opacity,transform] duration-300
                 ease-out active:scale-[0.96] [@media(hover:hover)]:hover:opacity-100"
      style={{ padding: 'var(--margin)', opacity: 0.55 }}
    >
      <span className="label">{on ? 'Sound' : 'Silence'}</span>
      {on ? (
        <Volume2 size={14} strokeWidth={1.25} />
      ) : (
        <VolumeX size={14} strokeWidth={1.25} />
      )}
    </button>
  )
}
