'use client'

import { useState } from 'react'
import { projects } from '@/data/projects'
import { Project } from '@/types/project'
import ProjectPreview from './ProjectPreview'

export default function ProjectShowcase() {
  const [activeId, setActiveId] = useState(projects[0]?.id)
  const activeProject = projects.find((p) => p.id === activeId) ?? projects[0]

  return (
    <section>
      <h2 className="text-xl font-semibold text-black mb-8">Selected works</h2>
      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
      {/* Sidebar – project list */}
      <nav className="w-full md:w-[220px] shrink-0">
        <ul className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-0">
          {projects.map((project) => (
            <li key={project.id} className="border-b border-[#E5E5E5] last:border-b-0">
              <button
                onClick={() => setActiveId(project.id)}
                className={`w-full text-left px-1 py-3.5 text-sm transition-colors whitespace-nowrap cursor-pointer ${
                  project.id === activeId
                    ? 'text-black font-medium'
                    : 'text-[#71717D] hover:text-black'
                }`}
              >
                {project.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Preview + Controls */}
      <div className="flex-1 min-w-0">
        <ProjectPreview project={activeProject} />
      </div>
      </div>
    </section>
  )
}
