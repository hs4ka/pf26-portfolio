import Nav from '@/components/Nav'
import Bio from '@/components/Bio'
import ProjectShowcase from '@/components/ProjectShowcase'

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-[1920px] mx-auto">
        <Nav />
        <Bio />
        <ProjectShowcase />
      </div>
    </main>
  )
}
