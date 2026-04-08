// frontend/lib/rsvp.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createRSVP } from "./rsvp"

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

const words = ["one", "two", "three", "four", "five"]

describe("createRSVP", () => {
  it("starts at given index", () => {
    const rsvp = createRSVP({ words, initialIndex: 2, wpm: 60 })
    expect(rsvp.getState().currentIndex).toBe(2)
    expect(rsvp.getState().isPlaying).toBe(false)
  })

  it("advances words on play", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(1000) // 60 WPM = 1000ms per word
    expect(rsvp.getState().currentIndex).toBe(1)
    vi.advanceTimersByTime(1000)
    expect(rsvp.getState().currentIndex).toBe(2)
    rsvp.pause()
  })

  it("stops advancing on pause", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(1000)
    rsvp.pause()
    vi.advanceTimersByTime(2000)
    expect(rsvp.getState().currentIndex).toBe(1)
  })

  it("seek jumps to index", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.seek(3)
    expect(rsvp.getState().currentIndex).toBe(3)
  })

  it("setWpm updates speed mid-play", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    rsvp.play()
    rsvp.setWpm(120) // now 500ms per word
    vi.advanceTimersByTime(500)
    expect(rsvp.getState().currentIndex).toBe(1)
    rsvp.pause()
  })

  it("stops at last word without going out of bounds", () => {
    const rsvp = createRSVP({ words, initialIndex: 4, wpm: 60 })
    rsvp.play()
    vi.advanceTimersByTime(2000)
    expect(rsvp.getState().currentIndex).toBe(4)
    expect(rsvp.getState().isPlaying).toBe(false)
  })

  it("getOrpParts splits word at 30% position", () => {
    const rsvp = createRSVP({ words, initialIndex: 0, wpm: 60 })
    expect(rsvp.getOrpParts("hello")).toEqual({ before: "h", anchor: "e", after: "llo" })
    expect(rsvp.getOrpParts("a")).toEqual({ before: "", anchor: "a", after: "" })
    expect(rsvp.getOrpParts("go")).toEqual({ before: "g", anchor: "o", after: "" })
  })
})
