"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface NavBarProps {
  showBack?: boolean
}

export function NavBar({ showBack = false }: NavBarProps) {
  const router = useRouter()
  return (
    <nav className="w-full h-12 bg-surface border-b border-muted flex items-center px-6 gap-4">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-muted hover:text-white transition-colors font-mono text-sm"
          aria-label="Go back"
        >
          ←
        </button>
      )}
      <Link href="/" className="font-display font-bold text-lg tracking-tight text-white">
        VELOCITY
      </Link>
    </nav>
  )
}
