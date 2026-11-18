import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

export const MAX_SECONDS = 120 // VO-7
export const WARN_SECONDS = 105 // 1:45
export const MSG_NO_MIC = 'We can’t hear a microphone. Please plug one in and try again.'
export const MSG_NOTHING = 'We couldn’t hear anything. Please try again.'
export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error'

/** Audio lives only in memory: it is converted to 16 kHz samples, sent to the on-device
 *  engine through IPC, and dropped. Nothing is written to disk or sent over a network. */
async function toPcm16k(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext()
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
  await ctx.close()
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * 16000)), 16000)
  const src = off.createBufferSource()
  src.buffer = buf; src.connect(off.destination); src.start()
  return (await off.startRendering()).getChannelData(0)
}

export function useVoiceRecorder(onText: (t: string) => void, micId?: string) {
  const [state, setState] = useState<VoiceState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [engineReady, setEngineReady] = useState(false) // VO-10
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const cb = useRef(onText); cb.current = onText

  useEffect(() => {
    let on = true
    const poll = async () => {
      const ok = await api.voice.ready().catch(() => false)
      if (!on) return
      setEngineReady(ok)
      if (!ok) setTimeout(poll, 1000)
    }
    poll()
    return () => { on = false }
  }, [])

  const stop = useCallback(() => { if (rec.current?.state === 'recording') rec.current.stop() }, [])

  useEffect(() => {
    if (state !== 'recording') return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [state])
  useEffect(() => { if (state === 'recording' && seconds >= MAX_SECONDS) stop() }, [seconds, state, stop])

  const start = async () => {
    setError('')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: micId ? { deviceId: { exact: micId } } : true })
    } catch { setError(MSG_NO_MIC); setState('error'); return }
    chunks.current = []
    const r = new MediaRecorder(stream)
    rec.current = r
    r.ondataavailable = (e) => chunks.current.push(e.data)
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      setState('transcribing')
      try {
        const text = (await api.voice.transcribe(await toPcm16k(new Blob(chunks.current)))).trim()
        chunks.current = [] // VO-6: discard audio
        if (!text) { setError(MSG_NOTHING); setState('error') } else { cb.current(text); setState('idle') }
      } catch { chunks.current = []; setError('Something went wrong. Please try again.'); setState('error') }
    }
    setSeconds(0); setState('recording'); r.start()
  }
  return { state, seconds, error, engineReady, start, stop }
}
