import { useCallback } from 'react';
import { useNavigate, type NavigateOptions, type To } from 'react-router';

/** Fire-and-forget navigation: a rejected navigation is logged instead of left unhandled. */
export function useAppNavigate(): (to: To, options?: NavigateOptions) => void {
  const navigate = useNavigate();
  return useCallback(
    (to, options) => {
      Promise.resolve(navigate(to, options)).catch((e: unknown) => {
        console.error(e);
      });
    },
    [navigate],
  );
}
