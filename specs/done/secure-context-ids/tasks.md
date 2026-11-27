# secure-context-ids (quick)

## T1 — IDs work over plain HTTP
Opened over plain HTTP on a LAN address (e.g. `http://192.168.x.x:3000` from a phone), the page has no `crypto.randomUUID`, because browsers only provide it in a secure context. Start session, add problem and log attempt throw before saving, and the button silently does nothing. IDs must work in any context.

- covers: [bugfix]
- runner: implementer
- allowed files: `src/utils/id.ts`, `src/utils/__tests__/id.test.ts`, `src/pages/Session.tsx`
- check: `npx vitest run src/utils/__tests__/id.test.ts src/pages/__tests__/Session.test.tsx` and `rg -n "randomUUID" src --glob '!**/__tests__/**' --glob '!src/setupTests.ts' --glob '!src/utils/id.ts'` prints nothing
- tests to add (`src/utils/__tests__/id.test.ts`):
  - "uses randomUUID when available"
  - "falls back without randomUUID": the result matches `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/`, and two calls differ
- parallel-safe: no
- schema-change: no
- depends-on: []
- notes:
  - `export const newId = (): string`. If `typeof crypto.randomUUID === 'function'`, return it. Otherwise fill 16 bytes with `crypto.getRandomValues`, set the version (byte 6 = `0x4_`) and variant (byte 8 = `0b10__`) bits, and hex-format them as 8-4-4-4-12.
  - Replace the three `crypto.randomUUID()` calls in `Session.tsx` with `newId()`.
  - `src/setupTests.ts` mocks `window.crypto` globally with a `getRandomValues` that doesn't fill the array. In the fallback test, stub `crypto` with `vi.stubGlobal` using Node's `webcrypto` (from `node:crypto`) without `randomUUID`, and restore it afterwards with `vi.unstubAllGlobals`. Don't edit `setupTests.ts`.
  - No new dependency.
