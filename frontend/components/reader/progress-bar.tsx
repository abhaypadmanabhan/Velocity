interface ProgressBarProps {
  current: number
  total: number
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <div className="w-full h-0.5 bg-muted">
      <div className="h-full bg-primary transition-all duration-100" style={{ width: `${pct}%` }} />
    </div>
  )
}
