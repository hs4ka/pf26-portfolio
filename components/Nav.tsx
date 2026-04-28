export default function Nav() {
  return (
    <nav className="flex items-center justify-between w-full mb-10 md:mb-[72px]">
      <span className="font-sans text-brand text-base">AKASH</span>
      <div className="flex items-center gap-6 md:gap-[40px]">
        <a
          href="https://linkedin.com/in/your-handle"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-black transition-colors text-base"
        >
          LinkedIn
        </a>
        <a
          href="https://x.com/your-handle"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-black transition-colors text-base"
        >
          X
        </a>
      </div>
    </nav>
  )
}
