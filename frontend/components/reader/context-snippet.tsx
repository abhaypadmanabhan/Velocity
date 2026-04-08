const WINDOW = 15

interface ContextSnippetProps {
  words: string[]
  currentIndex: number
}

export function ContextSnippet({ words, currentIndex }: ContextSnippetProps) {
  const start = Math.max(0, currentIndex - WINDOW)
  const end = Math.min(words.length - 1, currentIndex + WINDOW)
  const snippet = words.slice(start, end + 1)
  const highlightIdx = currentIndex - start

  return (
    <div className="px-6 py-4 font-mono text-sm leading-relaxed pointer-events-none select-none" aria-hidden="true">
      {snippet.map((word, i) => (
        <span key={`${start + i}-${word}`}>
          {i === highlightIdx ? (
            <span style={{ color: "rgba(219,184,255,0.55)" }}>{word}</span>
          ) : (
            <span style={{ color: "#4a2c5a" }}>{word}</span>
          )}{" "}
        </span>
      ))}
    </div>
  )
}
