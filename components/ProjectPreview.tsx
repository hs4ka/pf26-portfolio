'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceString,
  useViewModelInstanceNumber,
  useViewModelInstanceBoolean,
} from '@rive-app/react-canvas'
import { Project, RiveDataBinding } from '@/types/project'

// --- Data Binding Controls ---

function DataBindingNumberControl({
  path,
  label,
  defaultValue,
  viewModelInstance,
  onValueChange,
  externalValue,
  hidden,
}: {
  path: string
  label: string
  defaultValue?: number
  viewModelInstance: ReturnType<typeof useViewModelInstance>
  onValueChange?: (name: string, value: number) => void
  externalValue?: number
  hidden?: boolean
}) {
  const { value, setValue } = useViewModelInstanceNumber(path, viewModelInstance)
  const [localValue, setLocalValue] = useState(String(defaultValue ?? ''))
  const lastExternalRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setLocalValue(String(value))
    }
  }, [value])

  // Auto-update from external value (e.g. digit splitting)
  useEffect(() => {
    if (
      externalValue !== undefined &&
      externalValue !== lastExternalRef.current
    ) {
      lastExternalRef.current = externalValue
      setLocalValue(String(externalValue))
      if (setValue) {
        setValue(externalValue)
      }
    }
  }, [externalValue, setValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setLocalValue(raw)
    const num = parseFloat(raw)
    if (!isNaN(num) && setValue) {
      setValue(num)
      onValueChange?.(path, num)
    }
  }

  if (hidden) return null

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#71717D] font-medium">{label}</label>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        placeholder="Enter a number"
        className="w-full bg-white text-sm text-black rounded-xl px-4 py-3 outline-none border border-[#E5E5E5] focus:border-[#71717D] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

function DataBindingStringControl({
  path,
  label,
  defaultValue,
  viewModelInstance,
  externalValue,
}: {
  path: string
  label: string
  defaultValue?: string
  viewModelInstance: ReturnType<typeof useViewModelInstance>
  externalValue?: string
}) {
  const { value, setValue } = useViewModelInstanceString(path, viewModelInstance)
  const [localValue, setLocalValue] = useState(String(defaultValue ?? ''))
  const [userEdited, setUserEdited] = useState(false)
  const lastExternalRef = useRef<string | undefined>(undefined)
  const settingRef = useRef(false)

  useEffect(() => {
    if (settingRef.current) {
      settingRef.current = false
      return
    }
    if (value !== undefined && value !== null && !userEdited) {
      setLocalValue(value)
    }
  }, [value, userEdited])

  // Auto-update from linked conditional defaults (only if user hasn't manually edited)
  useEffect(() => {
    if (
      externalValue !== undefined &&
      !userEdited &&
      externalValue !== lastExternalRef.current
    ) {
      lastExternalRef.current = externalValue
      settingRef.current = true
      setLocalValue(externalValue)
      if (setValue) {
        setValue(externalValue)
      }
    }
  }, [externalValue, userEdited, setValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setUserEdited(true)
    setLocalValue(raw)
    if (setValue) {
      setValue(raw)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-[#71717D] font-medium">{label}</label>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder="Type..."
        className="w-full bg-white text-sm text-black rounded-xl px-4 py-3 outline-none border border-[#E5E5E5] focus:border-[#71717D] transition-colors"
      />
    </div>
  )
}

function DataBindingBooleanControl({
  path,
  label,
  defaultValue,
  viewModelInstance,
  hidden,
}: {
  path: string
  label: string
  defaultValue?: boolean
  viewModelInstance: ReturnType<typeof useViewModelInstance>
  hidden?: boolean
}) {
  const { value, setValue } = useViewModelInstanceBoolean(path, viewModelInstance)
  const isOn = value ?? defaultValue ?? false

  // Set default value on mount for hidden controls
  useEffect(() => {
    if (hidden && defaultValue !== undefined && setValue) {
      setValue(defaultValue)
    }
  }, [hidden, defaultValue, setValue])

  const handleToggle = () => {
    if (setValue) {
      setValue(!isOn)
    }
  }

  if (hidden) return null

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-[#71717D] font-medium">{label}</span>
      <button
        onClick={handleToggle}
        className={`w-10 h-[22px] rounded-full transition-colors relative cursor-pointer ${
          isOn ? 'bg-black' : 'bg-[#E5E5E5]'
        }`}
      >
        <span
          className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${
            isOn ? 'left-[22px]' : 'left-[3px]'
          }`}
        />
      </button>
    </div>
  )
}

// --- Rive Preview ---

interface DiscoveredInput {
  name: string
  type: 'boolean' | 'number' | 'trigger'
  value?: boolean | number
}

// Shared hook for discovering state machine inputs
function useDiscoverInputs(rive: ReturnType<typeof useRive>['rive'], riveMachine?: string) {
  const [inputs, setInputs] = useState<DiscoveredInput[]>([])

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

  return inputs
}

function useHandleInputChange(rive: ReturnType<typeof useRive>['rive'], riveMachine?: string, setInputs?: React.Dispatch<React.SetStateAction<DiscoveredInput[]>>) {
  return useCallback(
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

      setInputs?.((prev) =>
        prev.map((inp) =>
          inp.name === name ? { ...inp, value: type === 'trigger' ? inp.value : newValue } : inp
        )
      )
    },
    [rive, riveMachine, setInputs]
  )
}

// Controls UI for state machine inputs
function StateMachineControls({
  inputs,
  onInputChange,
}: {
  inputs: DiscoveredInput[]
  onInputChange: (name: string, type: string, newValue?: boolean | number) => void
}) {
  if (inputs.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {inputs.map((inp) => (
        <div key={inp.name} className="flex flex-col gap-1.5">
          <label className="text-xs text-[#71717D] font-medium">{inp.name}</label>
          {inp.type === 'boolean' && (
            <button
              onClick={() => onInputChange(inp.name, 'boolean', !inp.value)}
              className={`w-fit px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                inp.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#71717D] border-[#E5E5E5] hover:border-[#71717D]'
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
                onInputChange(inp.name, 'number', parseFloat(e.target.value))
              }
              className="w-full h-2 accent-black cursor-pointer"
            />
          )}

          {inp.type === 'trigger' && (
            <button
              onClick={() => onInputChange(inp.name, 'trigger')}
              className="w-fit px-4 py-2 rounded-xl bg-white text-sm text-black font-medium border border-[#E5E5E5] hover:border-[#71717D] transition-colors active:scale-[0.98]"
            >
              Fire
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// Simple Rive preview — no data binding hooks (safe for files without ViewModels)
function RivePreviewSimple({
  src,
  artboard,
  riveMachine,
  showRestart,
}: {
  src: string
  artboard?: string
  riveMachine?: string
  showRestart?: boolean
}) {
  const [inputs, setInputs] = useState<DiscoveredInput[]>([])
  const [restartKey, setRestartKey] = useState(0)

  const { RiveComponent, rive } = useRive({
    src,
    artboard: artboard ?? undefined,
    stateMachines: riveMachine ?? undefined,
    autoplay: true,
    key: `rive-${restartKey}`,
  })

  const discoveredInputs = useDiscoverInputs(rive, riveMachine)
  useEffect(() => { setInputs(discoveredInputs) }, [discoveredInputs])

  const handleInputChange = useHandleInputChange(rive, riveMachine, setInputs)

  const handleRestart = useCallback(() => {
    setRestartKey((k) => k + 1)
  }, [])

  const hasControls = inputs.length > 0 || showRestart

  return (
    <div>
      <div className="w-full rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
        <div className="max-w-[680px] mx-auto aspect-[4/3]">
          <RiveComponent key={restartKey} className="w-full h-full" />
        </div>
      </div>

      {hasControls && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-black mb-4">Controls</h3>

          {showRestart && (
            <button
              onClick={handleRestart}
              className="px-4 py-2 rounded-xl bg-white text-sm text-black font-medium border border-[#E5E5E5] hover:border-[#71717D] transition-colors active:scale-[0.98] mb-4"
            >
              ↻ Restart
            </button>
          )}

          <StateMachineControls inputs={inputs} onInputChange={handleInputChange} />
        </div>
      )}
    </div>
  )
}

// Rive preview WITH data binding hooks (only used when riveDataBindings is set)
function RivePreviewWithBindings({
  src,
  artboard,
  riveMachine,
  riveDataBindings,
}: {
  src: string
  artboard?: string
  riveMachine?: string
  riveDataBindings: RiveDataBinding[]
}) {
  const [inputs, setInputs] = useState<DiscoveredInput[]>([])
  const [bindingValues, setBindingValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const b of riveDataBindings) {
      if (b.type === 'number' && b.defaultValue !== undefined) {
        initial[b.name] = b.defaultValue as number
      }
    }
    return initial
  })

  const { RiveComponent, rive } = useRive({
    src,
    artboard: artboard ?? undefined,
    stateMachines: riveMachine ?? undefined,
    autoplay: true,
    autoBind: false,
  })

  const viewModel = useViewModel(rive, {})
  const viewModelInstance = useViewModelInstance(viewModel, { rive })

  const discoveredInputs = useDiscoverInputs(rive, riveMachine)
  useEffect(() => { setInputs(discoveredInputs) }, [discoveredInputs])

  const handleInputChange = useHandleInputChange(rive, riveMachine, setInputs)

  const handleBindingValueChange = useCallback((name: string, value: number) => {
    setBindingValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  // Resolve conditional defaults for linked string bindings
  const resolveConditionalDefault = useCallback((binding: RiveDataBinding): string | undefined => {
    if (!binding.linkedTo || !binding.conditionalDefaults) return undefined
    const sourceValue = bindingValues[binding.linkedTo]
    if (sourceValue === undefined) return undefined
    const match = binding.conditionalDefaults.find(
      (cd) => sourceValue >= cd.min && sourceValue <= cd.max
    )
    return match?.value
  }, [bindingValues])

  // Resolve digit position from linked number (only fires when all 3 digits are entered)
  const resolveDigitValue = useCallback((binding: RiveDataBinding): number | undefined => {
    if (!binding.linkedTo || !binding.digitPosition) return undefined
    const sourceValue = bindingValues[binding.linkedTo]
    if (sourceValue === undefined) return undefined
    const str = String(Math.abs(Math.floor(sourceValue)))
    if (str.length < 3) return undefined // wait until full 3-digit number is entered
    switch (binding.digitPosition) {
      case 'hundreds': return parseInt(str[0], 10)
      case 'tens': return parseInt(str[1], 10)
      case 'ones': return parseInt(str[2], 10)
      default: return undefined
    }
  }, [bindingValues])

  const visibleBindings = riveDataBindings.filter((b) => !b.hidden)
  const hasControls = inputs.length > 0 || visibleBindings.length > 0

  return (
    <div>
      <div className="w-full rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
        <div className="max-w-[680px] mx-auto aspect-[4/3]">
          <RiveComponent className="w-full h-full" />
        </div>
      </div>

      {hasControls && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-black mb-4">Controls</h3>

          {viewModelInstance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {riveDataBindings.map((binding) =>
                binding.type === 'number' ? (
                  <DataBindingNumberControl
                    key={binding.name}
                    path={binding.name}
                    label={binding.label ?? binding.name}
                    defaultValue={binding.defaultValue as number}
                    viewModelInstance={viewModelInstance}
                    onValueChange={handleBindingValueChange}
                    externalValue={resolveDigitValue(binding)}
                    hidden={binding.hidden}
                  />
                ) : binding.type === 'boolean' ? (
                  <DataBindingBooleanControl
                    key={binding.name}
                    path={binding.name}
                    label={binding.label ?? binding.name}
                    defaultValue={binding.defaultValue as boolean}
                    viewModelInstance={viewModelInstance}
                    hidden={binding.hidden}
                  />
                ) : (
                  <DataBindingStringControl
                    key={binding.name}
                    path={binding.name}
                    label={binding.label ?? binding.name}
                    defaultValue={binding.defaultValue as string}
                    viewModelInstance={viewModelInstance}
                    externalValue={resolveConditionalDefault(binding)}
                  />
                )
              )}
            </div>
          )}

          <StateMachineControls inputs={inputs} onInputChange={handleInputChange} />
        </div>
      )}
    </div>
  )
}

// --- Static previews ---

function VideoPreview({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [])

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
      <div className="max-w-[680px] mx-auto aspect-[4/3]">
        <video
          ref={ref}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#E5E5E5] bg-white">
      <div className="max-w-[680px] mx-auto aspect-[4/3]">
        <Image
          src={src}
          alt={alt}
          width={800}
          height={600}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

// --- Main component ---

export default function ProjectPreview({ project }: { project: Project }) {
  const { mediaType, src, riveArtboard, riveMachine, riveShowRestart, riveDataBindings } = project

  return (
    <div key={project.id}>
      {mediaType === 'image' && <ImagePreview src={src} alt={project.title} />}
      {mediaType === 'video' && <VideoPreview src={src} />}
      {mediaType === 'rive' && riveDataBindings && riveDataBindings.length > 0 && (
        <RivePreviewWithBindings
          src={src}
          artboard={riveArtboard}
          riveMachine={riveMachine}
          riveDataBindings={riveDataBindings}
        />
      )}
      {mediaType === 'rive' && (!riveDataBindings || riveDataBindings.length === 0) && (
        <RivePreviewSimple src={src} artboard={riveArtboard} riveMachine={riveMachine} showRestart={riveShowRestart} />
      )}
    </div>
  )
}

