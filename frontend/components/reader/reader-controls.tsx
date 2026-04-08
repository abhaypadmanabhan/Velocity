"use client"
import { Button } from "@/components/ui/button"

interface ReaderControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onBack: () => void
  onForward: () => void
}

export function ReaderControls({ isPlaying, onPlay, onPause, onBack, onForward }: ReaderControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        className="font-mono text-xs border-muted text-muted hover:border-white hover:text-white"
        aria-label="Back 10 words"
      >
        ← 10
      </Button>
      <Button
        onClick={isPlaying ? onPause : onPlay}
        className="font-mono text-sm bg-primary hover:bg-primary/80 text-white border-none w-24"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "PAUSE" : "PLAY"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onForward}
        className="font-mono text-xs border-muted text-muted hover:border-white hover:text-white"
        aria-label="Forward 10 words"
      >
        10 →
      </Button>
    </div>
  )
}
