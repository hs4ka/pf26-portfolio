export type MediaType = 'image' | 'video' | 'rive'
export type Category = 'Prototypes' | 'Rive' | 'Visuals'

export interface RiveConditionalDefault {
  min: number
  max: number
  value: string
}

export interface RiveDataBinding {
  name: string         // property name in the ViewModel
  type: 'string' | 'number' | 'boolean'
  label?: string       // display label (defaults to name)
  defaultValue?: string | number | boolean
  hidden?: boolean     // hide from controls UI (still binds to rive)
  linkedTo?: string    // name of another binding whose value drives this one's default
  conditionalDefaults?: RiveConditionalDefault[] // range-based defaults when linkedTo is set
  digitPosition?: 'hundreds' | 'tens' | 'ones' // auto-extract digit from linked number
}

export interface Project {
  id: string
  title: string
  category: Category
  mediaType: MediaType
  src: string
  riveArtboard?: string          // artboard name (for multi-artboard files)
  riveMachine?: string
  riveShowRestart?: boolean        // show a restart button for the animation
  riveViewModel?: string         // ViewModel name from Rive editor
  riveDataBindings?: RiveDataBinding[]
}
