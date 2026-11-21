import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FocusModeContext } from './FocusModeContext';

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false);
  const value = useMemo(() => ({ focus, setFocus }), [focus]);
  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>;
}
