// frontend/hooks/use-rsvp.ts
"use client"
import { useEffect, useRef, useState } from "react"
import { createRSVP, RSVPEngine, RSVPState } from "@/lib/rsvp"

export function useRSVP(words: string[], initialIndex = 0, initialWpm = 250) {
  const engineRef = useRef<RSVPEngine | null>(null)
  const [state, setState] = useState<RSVPState>({
    currentIndex: initialIndex,
    isPlaying: false,
    wpm: initialWpm,
  })

  useEffect(() => {
    const engine = createRSVP({ words, initialIndex, wpm: initialWpm })
    engineRef.current = engine
    const unsub = engine.onTick((s) => setState({ ...s }))
    return () => {
      unsub()
      engine.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words])

  return {
    state,
    play: () => engineRef.current?.play(),
    pause: () => engineRef.current?.pause(),
    seek: (i: number) => engineRef.current?.seek(i),
    setWpm: (wpm: number) => engineRef.current?.setWpm(wpm),
    getOrpParts: (word: string) => engineRef.current?.getOrpParts(word) ?? { before: "", anchor: word, after: "" },
  }
}
