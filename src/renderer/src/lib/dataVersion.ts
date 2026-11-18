import { useSyncExternalStore } from 'react'
// Bumped after every save/delete so open screens and the pending-bills bell refresh live.
let version = 0
const subs = new Set<() => void>()
export const bump = () => { version++; subs.forEach((f) => f()) }
export const useDataVersion = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => version)
