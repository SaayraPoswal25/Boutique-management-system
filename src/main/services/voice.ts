import { userError } from '../db/util'

// Placeholder until the on-device speech engine is added (see requirements section 6.11).
// While ready() is false the "Speak Notes" buttons show "Getting ready..." and stay disabled.
export const voice = {
  ready: (): boolean => false,
  transcribe: (_pcm16k: Float32Array): string => {
    throw userError('Voice notes are not available yet.')
  }
}
