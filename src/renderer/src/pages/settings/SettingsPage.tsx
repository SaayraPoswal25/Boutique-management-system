import { useEffect, useState } from 'react'
import type { Settings, TextSize } from '@shared/types'
import { useToast } from '@/components/shared/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSettings } from '@/hooks/useSettings'
import { friendly } from '@/lib/api'
import { cn, ui } from '@/lib/utils'

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="mb-4 block font-semibold">{label}<div className="mt-1 font-normal">{children}</div></label>
const Toggle = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => (
  <div className="flex gap-2" role="group" aria-label={label}><Button variant={on ? 'primary' : 'outline'} onClick={() => set(true)}>{label} On</Button><Button variant={on ? 'outline' : 'primary'} onClick={() => set(false)}>{label} Off</Button></div>
)

/** S23 Settings, including the Voice Notes toggle and microphone selector (VO-11). */
export default function SettingsPage() {
  const { settings, update } = useSettings(), toast = useToast()
  const [s, setS] = useState<Settings>(settings), [mics, setMics] = useState<MediaDeviceInfo[]>([]), [err, setErr] = useState('')
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }))
  useEffect(() => { navigator.mediaDevices?.enumerateDevices().then((d) => setMics(d.filter((x) => x.kind === 'audioinput'))).catch(() => setMics([])) }, [])
  const save = async () => { try { await update(s); toast('Settings saved') } catch (e) { setErr(friendly(e)) } }
  return (
    <div className="max-w-xl">
      <h1 className={ui.h1}>Settings</h1>
      <div className={cn(ui.card, 'mt-4')}>
        <Row label="Business name (shown on printed bills)"><Input value={s.businessName} onChange={(e) => set('businessName', e.target.value)} /></Row>
        <Row label="Business phone"><Input value={s.businessPhone} onChange={(e) => set('businessPhone', e.target.value)} /></Row>
        <Row label="Measurement unit"><select className={ui.input} value={s.measurementUnit} onChange={(e) => set('measurementUnit', e.target.value as 'in' | 'cm')}><option value="in">Inches</option><option value="cm">Centimetres</option></select></Row>
        <Row label="Currency symbol"><Input value={s.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} /></Row>
        <Row label="Text size"><select className={ui.input} value={s.textSize} onChange={(e) => set('textSize', e.target.value as TextSize)}><option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra Large</option></select></Row>
        <Row label="Warn about bills pending for more than (days)"><Input type="number" value={s.pendingWarnDays} onChange={(e) => set('pendingWarnDays', Number(e.target.value) || 0)} /></Row>
        <div className="mb-4"><p className="mb-1 font-semibold">Automatic backup when the app closes</p><Toggle on={s.autoBackup} set={(v) => set('autoBackup', v)} label="Automatic Backup" /></div>
        <h2 className={ui.h2}>Voice Notes</h2>
        <p className="mb-3 text-muted-foreground">Speak instead of typing notes. Everything is understood on this computer. Nothing is recorded or sent anywhere. Language: English (Indian accents are understood).</p>
        <div className="mb-4"><Toggle on={s.voiceEnabled} set={(v) => set('voiceEnabled', v)} label="Voice Notes" /></div>
        <Row label="Microphone"><select className={ui.input} value={s.microphoneId} onChange={(e) => set('microphoneId', e.target.value)}><option value="">Default microphone</option>{mics.map((m) => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</option>)}</select></Row>
        {err && <p className="mb-3 text-danger">{err}</p>}
        <Button variant="primary" onClick={save}>Save Settings</Button>
      </div>
    </div>
  )
}
