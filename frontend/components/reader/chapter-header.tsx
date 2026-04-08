interface ChapterHeaderProps {
  title: string
  index: number
  total: number
}

export function ChapterHeader({ title, index, total }: ChapterHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-muted">
      <span className="font-mono text-xs text-muted uppercase tracking-widest">
        {index + 1}/{total}
      </span>
      <span className="font-display text-sm text-muted truncate">{title}</span>
    </div>
  )
}
