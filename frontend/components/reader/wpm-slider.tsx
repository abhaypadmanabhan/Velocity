"use client"
import { Slider } from "@/components/ui/slider"

interface WPMSliderProps {
  wpm: number
  onChange: (wpm: number) => void
}

export function WPMSlider({ wpm, onChange }: WPMSliderProps) {
  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <span className="font-mono text-xs text-muted uppercase tracking-widest w-8">Slow</span>
      <Slider
        min={100}
        max={1000}
        step={50}
        value={[wpm]}
        onValueChange={(val) => onChange(Array.isArray(val) ? val[0] : val)}
        className="flex-1"
      />
      <span className="font-mono text-xs text-muted uppercase tracking-widest w-8 text-right">Fast</span>
      <span className="font-mono text-xs text-white w-20 text-right tabular-nums">{wpm} WPM</span>
    </div>
  )
}
