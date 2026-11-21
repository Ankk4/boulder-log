import { useEffect, useRef } from 'react';

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
};

/** The Wake Lock API is missing in some browsers, though the DOM types say it is always present. */
function getWakeLock(): Navigator['wakeLock'] | undefined {
  return navigator.wakeLock;
}

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

    const wakeLock = getWakeLock();
    if (typeof wakeLock?.request !== 'function') {
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
      if (document.visibilityState === 'visible') {
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
