'use client'

import { Category } from '@/types/project'

const CATEGORIES: Category[] = ['Prototypes', 'Rive', 'Visuals']

interface Props {
  active: Category
  onChange: (c: Category) => void
}

export default function FilterPills({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`rounded-[40px] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-black text-white'
                : 'bg-[#F4F4F5] text-[#5A5A5A] hover:bg-neutral-200'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
