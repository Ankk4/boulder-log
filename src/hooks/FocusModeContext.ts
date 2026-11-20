import { createContext } from 'react'

export interface FocusModeValue {
  focus: boolean
  setFocus: (active: boolean) => void
}

export const FocusModeContext = createContext<FocusModeValue | null>(null)
