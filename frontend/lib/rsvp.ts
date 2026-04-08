// frontend/lib/rsvp.ts
export interface RSVPState {
  currentIndex: number
  isPlaying: boolean
  wpm: number
}

export interface OrpParts {
  before: string
  anchor: string
  after: string
}

export interface RSVPEngine {
  play: () => void
  pause: () => void
  seek: (index: number) => void
  setWpm: (wpm: number) => void
  getState: () => RSVPState
  getOrpParts: (word: string) => OrpParts
  destroy: () => void
  onTick: (cb: (state: RSVPState) => void) => () => void
}

export function createRSVP(opts: {
  words: string[]
  initialIndex: number
  wpm: number
}): RSVPEngine {
  let currentIndex = opts.initialIndex
  let wpm = opts.wpm
  let isPlaying = false
  let timer: ReturnType<typeof setInterval> | null = null
  const listeners = new Set<(state: RSVPState) => void>()

  function getInterval() {
    return Math.round(60_000 / wpm)
  }

  function emit() {
    const state = { currentIndex, isPlaying, wpm }
    listeners.forEach((cb) => cb(state))
  }

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startTimer() {
    clearTimer()
    timer = setInterval(() => {
      if (currentIndex >= opts.words.length - 1) {
        isPlaying = false
        clearTimer()
        emit()
        return
      }
      currentIndex += 1
      emit()
    }, getInterval())
  }

  return {
    play() {
      if (isPlaying) return
      isPlaying = true
      startTimer()
      emit()
    },

    pause() {
      if (!isPlaying) return
      isPlaying = false
      clearTimer()
      emit()
    },

    seek(index: number) {
      const clamped = Math.max(0, Math.min(index, opts.words.length - 1))
      currentIndex = clamped
      if (isPlaying) startTimer()
      emit()
    },

    setWpm(newWpm: number) {
      wpm = newWpm
      if (isPlaying) startTimer()
      emit()
    },

    getState() {
      return { currentIndex, isPlaying, wpm }
    },

    getOrpParts(word: string): OrpParts {
      if (word.length === 0) return { before: "", anchor: "", after: "" }
      const anchorIdx = word.length === 1 ? 0 : Math.max(1, Math.floor(word.length * 0.3))
      return {
        before: word.slice(0, anchorIdx),
        anchor: word[anchorIdx],
        after: word.slice(anchorIdx + 1),
      }
    },

    destroy() {
      clearTimer()
      listeners.clear()
    },

    onTick(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
  }
}
