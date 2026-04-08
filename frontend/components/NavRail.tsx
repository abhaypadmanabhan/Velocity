"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Plus, LayoutDashboard, Library, PieChart, Settings } from "lucide-react"

interface NavRailProps {
  onAddClick?: () => void;
  isUploading?: boolean;
}

export function NavRail({ onAddClick, isUploading = false }: NavRailProps) {
  const pathname = usePathname();

  return (
    <nav className="flex h-screen w-[80px] flex-col items-center border-r border-[#4a2c5a] bg-[#120216] py-6 flex-shrink-0 z-10 relative">
      <button 
        onClick={onAddClick}
        disabled={isUploading}
        className={`mb-8 flex h-12 w-12 items-center justify-center bg-[#ee1438] text-white hover:bg-white hover:text-[#120216] transition-colors border border-[#ee1438] group ${isUploading ? 'opacity-50' : ''}`}
      >
        <Plus className="w-6 h-6 group-hover:stroke-[3px] transition-all" />
      </button>

      <div className="flex flex-col gap-6 w-full items-center">
        <Link href="/" className={`flex h-12 w-12 items-center justify-center transition-colors group ${pathname === '/' ? 'bg-white text-[#120216] border border-white' : 'text-white hover:bg-[#ee1438]'}`}>
          <LayoutDashboard className="w-6 h-6" />
        </Link>
        <Link href="#" className="flex h-12 w-12 items-center justify-center text-white hover:bg-[#ee1438] transition-colors group">
          <Library className="w-6 h-6" />
        </Link>
        <Link href="/analytics" className={`flex h-12 w-12 items-center justify-center transition-colors group ${pathname === '/analytics' ? 'bg-[#ee1438] text-white' : 'text-white hover:bg-[#ee1438]'}`}>
          <PieChart className="w-6 h-6" />
        </Link>
      </div>
      <div className="mt-auto flex flex-col gap-6 w-full items-center">
        <button className="flex h-12 w-12 items-center justify-center text-white hover:bg-[#ee1438] transition-colors group">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </nav>
  )
}
