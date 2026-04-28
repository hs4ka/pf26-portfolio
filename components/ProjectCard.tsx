'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceString,
  useViewModelInstanceNumber,
} from '@rive-app/react-canvas'
import { Project, RiveDataBinding } from '@/types/project'

interface DiscoveredInput {
  name: string
  type: 'boolean' | 'number' | 'trigger'
  value?: boolean | number
}

// --- Data Binding Controls ---

function DataBindingNumberControl({
  path,
  label,
  defaultValue,
  viewModelInstance,
}: {
  path: string
  label: string
  defaultValue?: number
  viewModelInstance: ReturnType<typeof useViewModelInstance>
}) {
  const { value, setValue } = useViewModelInstanceNumber(path, viewModelInstance)
  const [localValue, setLocalValue] = useState(String(defaultValue ?? ''))

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setLocalValue(String(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    const num = parseFloat(raw)
    if (!isNaN(num) && setValue) {
      setValue(num)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/80 text-[11px] font-medium min-w-[60px] truncate">
        {label}
      </span>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        placeholder="0"
        className="flex-1 bg-white/15 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none placeholder:text-white/40 focus:bg-white/25 transition-colors border border-white/10 focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

function DataBindingStringControl({
  path,
  label,
  defaultValue,
  viewModelInstance,
}: {
  path: string
  label: string
  defaultValue?: string
  viewModelInstance: ReturnType<typeof useViewModelInstance>
}) {
  const { value, setValue } = useViewModelInstanceString(path, viewModelInstance)
  const [localValue, setLocalValue] = useState(String(defaultValue ?? ''))

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setLocalValue(value)
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    if (setValue) {
      setValue(raw)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-white/80 text-[11px] font-medium min-w-[60px] truncate">
        {label}
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Type..."
        className="flex-1 bg-white/15 text-white text-[11px] rounded-lg px-2.5 py-1.5 outline-none placeholder:text-white/40 focus:bg-white/25 transition-colors border border-white/10 focus:border-white/30"
      />
    </div>
  )
}

// --- Rive Card with Data Binding + State Machine Inputs ---

function RiveCard({
  src,
  riveMachine,
  riveDataBindings,
}: {
  src: string
  riveMachine?: string
  riveDataBindings?: RiveDataBinding[]
}) {
  const [inputs, setInputs] = useState<DiscoveredInput[]>([])
  const hasDataBindings = riveDataBindings && riveDataBindings.length > 0

  const { RiveComponent, rive } = useRive({
    src,
    stateMachines: riveMachine ?? undefined,
    autoplay: true,
    ...(hasDataBindings ? { autoBind: false } : {}),
  })

  // Data binding hooks
  const viewModel = useViewModel(rive, {})
  const viewModelInstance = useViewModelInstance(viewModel, { rive })

  // Auto-discover state machine inputs
  useEffect(() => {
    if (!rive || !riveMachine) return

    let attempts = 0
    const maxAttempts = 10

    const check = () => {
      const sm = rive.stateMachineInputs(riveMachine)
      if (!sm || sm.length === 0) {
        attempts++
        if (attempts < maxAttempts) {
          timer = setTimeout(check, 200)
        }
        return
      }

      const discovered: DiscoveredInput[] = sm.map((input) => {
        if (typeof input.fire === 'function') {
          return { name: input.name, type: 'trigger' as const }
        } else if (typeof input.value === 'boolean') {
          return { name: input.name, type: 'boolean' as const, value: input.value }
        } else {
          return { name: input.name, type: 'number' as const, value: input.value as number }
        }
      })
      setInputs(discovered)
    }

    let timer = setTimeout(check, 200)
    return () => clearTimeout(timer)
  }, [rive, riveMachine])

  const handleInputChange = useCallback(
    (name: string, type: string, newValue?: boolean | number) => {
      if (!rive || !riveMachine) return
      const sm = rive.stateMachineInputs(riveMachine)
      if (!sm) return
      const target = sm.find((i) => i.name === name)
      if (!target) return

      if (type === 'trigger') {
        target.fire()
      } else if (type === 'boolean') {
        target.value = newValue as boolean
      } else if (type === 'number') {
        target.value = newValue as number
      }

      setInputs((prev) =>
        prev.map((inp) =>
          inp.name === name ? { ...inp, value: type === 'trigger' ? inp.value : newValue } : inp
        )
      )
    },
    [rive, riveMachine]
  )

  const hasControls = inputs.length > 0 || hasDataBindings

  return (
    <div className="relative w-full h-full group">
      <RiveComponent className="w-full h-full" />

      {hasControls && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-md p-3 flex flex-col gap-2 rounded-b-[17px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
          {/* Data binding controls */}
          {hasDataBindings &&
            viewModelInstance &&
            riveDataBindings!.map((binding) =>
              binding.type === 'number' ? (
                <DataBindingNumberControl
                  key={binding.name}
                  path={binding.name}
                  label={binding.label ?? binding.name}
                  defaultValue={binding.defaultValue as number}
                  viewModelInstance={viewModelInstance}
                />
              ) : (
                <DataBindingStringControl
                  key={binding.name}
                  path={binding.name}
                  label={binding.label ?? binding.name}
                  defaultValue={binding.defaultValue as string}
                  viewModelInstance={viewModelInstance}
                />
              )
            )}

          {/* State machine inputs */}
          {inputs.map((inp) => (
            <div key={inp.name} className="flex items-center gap-2">
              <span className="text-white/80 text-[11px] font-medium min-w-[60px] truncate">
                {inp.name}
              </span>

              {inp.type === 'boolean' && (
                <button
                  onClick={() => handleInputChange(inp.name, 'boolean', !inp.value)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    inp.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/20 text-white/70'
                  }`}
                >
                  {inp.value ? 'ON' : 'OFF'}
                </button>
              )}

              {inp.type === 'number' && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={(inp.value as number) ?? 0}
                  onChange={(e) =>
                    handleInputChange(inp.name, 'number', parseFloat(e.target.value))
                  }
                  className="flex-1 h-1 accent-white cursor-pointer"
                />
              )}

              {inp.type === 'trigger' && (
                <button
                  onClick={() => handleInputChange(inp.name, 'trigger')}
                  className="px-2 py-0.5 rounded-full bg-white/20 text-white/90 text-[10px] font-medium hover:bg-white/30 transition-colors active:scale-95"
                >
                  Fire
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VideoCard({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

export default function ProjectCard({ project }: { project: Project }) {
  const { mediaType, src, riveMachine, riveDataBindings } = project

  return (
    <div className="w-full aspect-[369/356] rounded-[17px] overflow-hidden bg-[#D9D9D9]">
      {mediaType === 'image' && (
        <Image
          src={src}
          alt={project.title}
          width={369}
          height={356}
          className="w-full h-full object-cover"
        />
      )}
      {mediaType === 'video' && <VideoCard src={src} />}
      {mediaType === 'rive' && (
        <RiveCard
          src={src}
          riveMachine={riveMachine}
          riveDataBindings={riveDataBindings}
        />
      )}
    </div>
  )
}
