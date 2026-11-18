import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useSettings } from '@/hooks/useSettings'
import { MAX_SECONDS, WARN_SECONDS, useVoiceRecorder } from '@/hooks/useVoiceRecorder'

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** A notes field with a "Speak Notes" button (VO-1 to VO-10). Text is inserted at the cursor
 *  (or the end) and stays editable. Nothing is saved until the form is saved (VO-4). */
export function VoiceNotesField({ label, value, onChange, multiline = true, error }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; error?: string }) {
  const { settings } = useSettings()
  const caret = useRef<[number, number] | null>(null)
  const insert = (text: string) => {
    const [a, b] = caret.current ?? [value.length, value.length]
    const before = value.slice(0, a), after = value.slice(b)
    onChange(before + (before && !/\s$/.test(before) ? ' ' : '') + text + (after && !/^\s/.test(after) ? ' ' : '') + after)
  }
  const v = useVoiceRecorder(insert, settings.microphoneId || undefined)
  const track = (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => {
    caret.current = [e.currentTarget.selectionStart ?? 0, e.currentTarget.selectionEnd ?? 0]
  }
  const props = { value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), onSelect: track, onBlur: track }
  return (
    <div className="mb-4">
      <label className="mb-1 block font-semibold">
        {label}
        {multiline ? <Textarea className="mt-1 font-normal" {...props} /> : <Input className="mt-1 font-normal" {...props} />}
      </label>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {settings.voiceEnabled && (
        <div className="mt-2" aria-live="polite">
          {v.state === 'recording' ? (
            <>
              <p className="mb-2 flex items-center gap-2 font-bold text-danger">
                <span className="h-3 w-3 animate-pulse rounded-full bg-danger motion-reduce:animate-none" />Recording {clock(v.seconds)} of {clock(MAX_SECONDS)}
              </p>
              {v.seconds >= WARN_SECONDS && <p className="mb-2 text-danger">Only {MAX_SECONDS - v.seconds} seconds left</p>}
              <Button variant="destructive" onClick={v.stop}>Stop Speaking</Button>
            </>
          ) : v.state === 'transcribing' ? (
            <p className="text-muted-foreground">Writing down what you said...</p>
          ) : (
            <>
              {v.state === 'error' && <p className="mb-2 text-danger">{v.error}</p>}
              <Button disabled={!v.engineReady} onClick={v.start}>{!v.engineReady ? 'Getting ready...' : v.state === 'error' ? 'Try Again' : 'Speak Notes'}</Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
