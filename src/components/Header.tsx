import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  onAddClick?: () => void
}

export default function Header({ onAddClick }: HeaderProps) {
  const pathname = usePathname()
  const showAddButton = pathname === '/graph'

  return (
    <div className="w-full flex justify-between items-center p-4 bg-black">
      <div className="relative w-[40px] h-[40px]">
        <Image
          src="/WW.png"
          alt="Workout Works Logo"
          fill
          sizes="40px"
          className="object-contain"
          priority
        />
      </div>
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="px-4 py-2 border border-[#D8110A]/50 bg-white/10 text-white/60 rounded-lg hover:bg-opacity-90 transition-colors"
        >
          Add Data
        </button>
      )}
    </div>
  )
} 