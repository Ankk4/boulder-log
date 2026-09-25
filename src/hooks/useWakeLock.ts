import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

/**
 * Request a screen wake lock while `active` is true.
 * No-ops when the Wake Lock API is unavailable.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!active) {
      const existing = sentinelRef.current;
      sentinelRef.current = null;
      if (existing && !existing.released) {
        void existing.release().catch(() => undefined);
      }
      return;
    }

    const wakeLock = navigator.wakeLock;
    if (!wakeLock?.request) {
      return;
    }

    let cancelled = false;

    const request = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const sentinel = (await wakeLock.request('screen')) as WakeLockSentinelLike;
        if (cancelled) {
          await sentinel.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = sentinel;
      } catch {
        // Permission denied or unsupported in this context — ignore.
      }
    };

    void request();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        void request();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const existing = sentinelRef.current;
      sentinelRef.current = null;
      if (existing && !existing.released) {
        void existing.release().catch(() => undefined);
      }
    };
  }, [active]);
}
