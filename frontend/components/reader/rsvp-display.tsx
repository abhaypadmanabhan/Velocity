interface OrpParts {
  before: string
  anchor: string
  after: string
}

interface RSVPDisplayProps {
  word: string
  orpParts: OrpParts
}

export function RSVPDisplay({ word, orpParts }: RSVPDisplayProps) {
  if (!word) return null
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ minHeight: "120px" }}
      aria-live="polite"
      aria-atomic="true"
      aria-label={word}
    >
      <div className="relative flex items-baseline font-mono text-5xl font-bold">
        <span className="text-white opacity-80 inline-block text-right" style={{ minWidth: "8ch" }}>
          {orpParts.before}
        </span>
        <span className="text-primary">{orpParts.anchor}</span>
        <span className="text-white opacity-80 inline-block text-left" style={{ minWidth: "8ch" }}>
          {orpParts.after}
        </span>
      </div>
    </div>
  )
}
