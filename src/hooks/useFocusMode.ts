import { useContext, useEffect } from 'react';
import { FocusModeContext } from './FocusModeContext';

/** True while a page has requested focus mode (shell hidden). False outside a provider. */
export function useFocusMode(): boolean {
  return useContext(FocusModeContext)?.focus ?? false;
}

/** Sets focus mode while `active` is true; clears it on change or unmount. */
export function useRequestFocusMode(active: boolean): void {
  const ctx = useContext(FocusModeContext);
  const setFocus = ctx?.setFocus;
  useEffect(() => {
    if (!setFocus || !active) return;
    setFocus(true);
    return () => setFocus(false);
  }, [setFocus, active]);
}
