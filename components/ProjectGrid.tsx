'use client'

import { useState } from 'react'
import { projects } from '@/data/projects'
import { Category } from '@/types/project'
import FilterPills from './FilterPills'
import ProjectCard from './ProjectCard'

export default function ProjectGrid() {
  const [active, setActive] = useState<Category>('Prototypes')

  const filtered = projects.filter((p) => p.category === active)

  return (
    <div>
      <FilterPills active={active} onChange={setActive} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-[14px]">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
