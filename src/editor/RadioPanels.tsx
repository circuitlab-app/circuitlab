import {
  Bluetooth,
  Cable,
  CheckCheck,
  Cloud,
  Mail,
  MessageSquareText,
  Network,
  RadioTower,
  Satellite,
  Smartphone,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PARTS, RADIOS, type RadioType } from '@/circuit/catalog'
import type { PartResult } from '@/circuit/solver'
import type { PartData } from '@/circuit/types'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useCircuit, type SelectedPart } from '@/store/circuit'
import { TextBox } from './DisplaySettings'

/*
 * The message modules on the board: SMS, Wi-Fi, Bluetooth, LoRa, GPS, CAN bus
 * and RS-485. Each card shows what the module is doing in one row; the details
 * panel shows what arrives at the other end: the phone's messages, the cloud
 * dashboard, the CAN frame on the car's bus or the Modbus register in the
 * control room.
 */

const ICONS: Record<RadioType, LucideIcon> = {
  gsm: MessageSquareText,
  wifi: Wifi,
  bluetooth: Bluetooth,
  lora: RadioTower,
  gps: Satellite,
  canBus: Network,
  rs485: Cable,
}

/** What the receiving end gets shown as. */
const RECEIVER_ICONS: Record<RadioType, LucideIcon> = {
  gsm: Smartphone,
  wifi: Cloud,
  bluetooth: Smartphone,
  lora: RadioTower,
  gps: Satellite,
  canBus: Network,
  rs485: Cable,
}

/** Where the GPS finds itself: Muscat, on the coast of Oman. */
export const GPS_POSITION = { lat: 23.588, lon: 58.3829 }
/** The demo LoRa gateway, a few kilometres away across the field. */
const LORA_DISTANCE_KM = 2.4
/** How strongly each radio is heard at the other end, in dBm (closer to 0 is stronger). */
const SIGNAL_DBM: Partial<Record<RadioType, number>> = { gsm: -71, wifi: -52, bluetooth: -60, lora: -108 }
/** The CAN identifier the reading goes out under, and the Modbus register the RS-485 module writes. */
export const CAN_ID = 0x1a0
export const MODBUS_REGISTER = 40001
/** The number a fresh SMS module texts: a made-up one, from the range kept for films and examples. */
export const DEFAULT_PHONE = '+1 555 0100'

/** What a module is doing right now, read from its simulation result. */
export function radioState(result?: PartResult) {
  const c = result?.channels
  const powered = result?.status === 'on'
  return {
    powered,
    linked: powered && (c?.link ?? 0) > 0.5,
    tx: powered && (c?.tx ?? 0) > 0.5,
    sent: Math.round(c?.sent ?? 0),
    value: Math.min(1, Math.max(0, c?.value ?? 0)),
    progress: c?.progress,
    sats: Math.round(c?.sats ?? 0),
    volts: Math.max(0, (c?.value ?? 0) * (result?.voltage ?? 0)),
  }
}

const percent = (value: number) => `${Math.round(value * 100)}%`
/** One byte, the way a CAN tool prints it. */
export const canByte = (value: number) => Math.round(value * 255).toString(16).toUpperCase().padStart(2, '0')
/** The number in the Modbus register: the share of the supply on IN, in thousandths. */
export const modbusValue = (value: number) => Math.round(value * 1000)
const latitude = (lat: number) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
const longitude = (lon: number) => `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`
const canId = `0x${CAN_ID.toString(16).toUpperCase()}`

/** Four signal bars: full once linked, a slow sweep while it searches. */
function Bars({ linked, searching, color }: { linked: boolean; searching: boolean; color: string }) {
  return (
    <span aria-hidden className="flex h-3 shrink-0 items-end gap-[1.5px]">
      {[0.35, 0.55, 0.78, 1].map((h, i) => (
        <span
          key={i}
          className={cn('w-[3px] rounded-[1px]', searching && 'animate-pulse')}
          style={{
            height: `${h * 100}%`,
            animationDelay: searching ? `${i * 160}ms` : undefined,
            background: linked ? color : 'color-mix(in oklch, var(--foreground) 18%, transparent)',
          }}
        />
      ))}
    </span>
  )
}

/** A dot that flashes with each message going out. */
function TxDot({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-100"
      style={{
        background: on ? color : 'color-mix(in oklch, var(--foreground) 16%, transparent)',
        boxShadow: on ? `0 0 6px 1px ${color}aa` : 'none',
      }}
    />
  )
}

/** The card row of a message module. */
export function RadioRow({ data, result }: { data: PartData; result?: PartResult }) {
  const { t } = useI18n()
  const type = data.type as RadioType
  const accent = PARTS[type].accent
  const s = radioState(result)
  const Icon = ICONS[type]
  const joining = s.powered && !s.linked

  // the wired buses look like a little bus monitor
  if (type === 'canBus' || type === 'rs485') {
    const frame = type === 'canBus' ? `${canId} ▸ ${canByte(s.value)}` : `${MODBUS_REGISTER} = ${modbusValue(s.value)}`
    const text = !s.powered ? t.radio.waiting : joining ? `${t.radio.joining[type]}…` : frame
    return (
      <div className="flex h-7 items-stretch" dir="ltr">
        <div
          role="status"
          aria-label={`${t.parts[type].name}: ${text}`}
          className="lcd flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden rounded-[6px] px-2.5 font-mono text-[12px] leading-none font-semibold whitespace-nowrap tabular-nums"
        >
          <TxDot on={s.tx} color={accent} />
          <span className={cn('min-w-0 truncate', !s.linked && 'font-sans text-[11px] opacity-60')}>{text}</span>
        </div>
      </div>
    )
  }

  let text: string
  let trailing: ReactNode = null
  if (!s.powered) text = t.radio.waiting
  else if (joining) text = type === 'gps' ? t.radio.sats(s.sats) : `${t.radio.joining[type]}…`
  else if (type === 'gsm') text = s.progress !== undefined ? `${t.radio.sending}…` : t.radio.ready
  else if (type === 'gps') text = latitude(GPS_POSITION.lat)
  else text = `↑ ${percent(s.value)}`

  if (type === 'gsm') {
    trailing = (
      <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
        <Mail className="size-3" aria-hidden />
        {s.sent}
      </span>
    )
  } else if (type === 'gps') {
    trailing = (
      <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-muted-foreground">
        PPS
        <TxDot on={s.tx} color={accent} />
      </span>
    )
  } else if (type === 'lora' && s.linked) {
    trailing = <span className="shrink-0 text-[10.5px] font-semibold text-muted-foreground tabular-nums">{LORA_DISTANCE_KM} km</span>
  } else {
    trailing = <TxDot on={s.tx} color={accent} />
  }

  return (
    <div
      role="status"
      aria-label={`${t.parts[type].name}: ${text}`}
      className="node-track relative flex items-center gap-1.5 overflow-hidden px-2.5"
      dir="ltr"
    >
      <Icon className="size-3.5 shrink-0" style={{ color: s.linked ? accent : 'var(--muted-foreground)' }} aria-hidden />
      {type !== 'gps' && <Bars linked={s.linked} searching={joining} color={accent} />}
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[11px] font-semibold tabular-nums',
          s.linked ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {text}
      </span>
      {trailing}
      {/* the text that is going out fills a thin line along the bottom */}
      {s.progress !== undefined && (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left"
          style={{ background: accent }}
          animate={{ scaleX: s.progress }}
          transition={{ duration: 0.1 }}
        />
      )}
    </div>
  )
}

/** The last few values a module sent, newest last, for the little chart. */
function useHistory(sent: number, value: number, keep = 40) {
  const [points, setPoints] = useState<number[]>([])
  const last = useRef(-1)
  useEffect(() => {
    if (sent === last.current) return
    last.current = sent
    setPoints((p) => (sent === 0 ? [] : [...p, value].slice(-keep)))
  }, [sent, value, keep])
  return points
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <div className="h-10" />
  const step = 100 / (points.length - 1)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)} ${(38 - p * 34).toFixed(2)}`).join(' ')
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <path d={`${line} L100 40 L0 40 Z`} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 px-2.5 py-1.5">
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <div className="truncate font-mono text-sm font-semibold tabular-nums" dir="ltr">
        {children}
      </div>
    </div>
  )
}

/** The SMS module's phone: the texts that arrived. */
function PhoneInbox({ data, sent, sending }: { data: PartData; sent: number; sending: boolean }) {
  const { t } = useI18n()
  const message = data.text?.trim() || t.radio.defaultMessage
  const shown = Math.min(sent, 3)
  return (
    <div className="space-y-1.5 rounded-xl bg-muted/50 p-2.5">
      <p className="text-[11px] font-medium text-muted-foreground" dir="ltr">
        {data.phone?.trim() || DEFAULT_PHONE}
      </p>
      {shown === 0 && !sending && <p className="py-2 text-center text-xs text-muted-foreground">{t.radio.noMessages}</p>}
      {Array.from({ length: shown }, (_, i) => (
        <motion.div
          key={sent - shown + i}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="max-w-[88%] rounded-2xl rounded-ss-md bg-card px-3 py-2 text-sm leading-snug shadow-sm"
        >
          <p className="break-words" dir="auto">
            {message}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10.5px] text-muted-foreground">
            <CheckCheck className="size-3 text-sky-500" aria-hidden />
            {t.radio.delivered}
          </p>
        </motion.div>
      ))}
      {sending && (
        <div
          role="status"
          aria-label={t.radio.sending}
          className="flex w-14 items-center justify-center gap-1 rounded-2xl rounded-ss-md bg-card px-3 py-2.5 shadow-sm"
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * The other end of a message module, for the details panel: what has arrived
 * at the phone, the cloud, the gateway, the car's dashboard or the control room.
 */
export function RadioReceiver({ data, result }: { data: PartData; result?: PartResult }) {
  const { t } = useI18n()
  const type = data.type as RadioType
  const accent = PARTS[type].accent
  const s = radioState(result)
  const history = useHistory(s.sent, s.value)
  const Icon = RECEIVER_ICONS[type]
  const state = !s.powered ? t.status.idle : s.linked ? t.parts[type].working : t.radio.joining[type]
  const dbm = SIGNAL_DBM[type]
  const { period, onEvent } = RADIOS[type]

  let body: ReactNode
  if (type === 'gsm') body = <PhoneInbox data={data} sent={s.sent} sending={s.progress !== undefined} />
  else if (type === 'gps') {
    body = (
      <div className="grid grid-cols-2 gap-2">
        <Field label={t.radio.position}>{s.linked ? latitude(GPS_POSITION.lat) : '—'}</Field>
        <Field label={t.radio.position}>{s.linked ? longitude(GPS_POSITION.lon) : '—'}</Field>
        <Field label={t.radio.signal}>{s.sats}</Field>
        <Field label="PPS">
          <span className="flex items-center gap-1.5">
            <TxDot on={s.tx} color={accent} />1 Hz
          </span>
        </Field>
      </div>
    )
  } else if (type === 'canBus') {
    body = (
      <div className="grid grid-cols-3 gap-2">
        <Field label="ID">{canId}</Field>
        <Field label="DLC">1</Field>
        <Field label="DATA">{s.linked ? canByte(s.value) : '—'}</Field>
      </div>
    )
  } else if (type === 'rs485') {
    body = (
      <div className="grid grid-cols-3 gap-2">
        <Field label="Slave">1</Field>
        <Field label="Reg.">{MODBUS_REGISTER}</Field>
        <Field label={t.radio.now}>{s.linked ? modbusValue(s.value) : '—'}</Field>
      </div>
    )
  } else {
    body = (
      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2" dir="ltr">
          <span className="text-2xl font-semibold tabular-nums">{s.linked ? percent(s.value) : '—'}</span>
          <span className="pb-1 font-mono text-xs text-muted-foreground tabular-nums">
            {s.linked ? `${s.volts.toFixed(2)} ${t.units.volt}` : ''}
          </span>
        </div>
        <Sparkline points={history} color={accent} />
      </div>
    )
  }

  return (
    <div className="space-y-2.5 rounded-xl border p-3">
      <div className="flex items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.radio.receivers[type]}</span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            s.linked
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              : s.powered
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                : 'bg-foreground/[0.06] text-muted-foreground',
          )}
        >
          {state}
        </span>
      </div>
      {body}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {type !== 'gps' && (
          <span>
            {t.radio.messages}: <b className="font-semibold text-foreground tabular-nums">{s.sent}</b>
          </span>
        )}
        {type === 'lora' && (
          <span>
            {t.radio.distance}:{' '}
            <b className="font-semibold text-foreground tabular-nums" dir="ltr">
              {LORA_DISTANCE_KM} km
            </b>
          </span>
        )}
        {dbm !== undefined && s.linked && (
          <span dir="ltr" className="tabular-nums">
            {dbm} dBm
          </span>
        )}
        {!onEvent && type !== 'gps' && (
          <span dir="ltr" className="tabular-nums">
            {period < 1 ? `${Math.round(1 / period)}/s` : `1/${period}s`}
          </span>
        )}
      </div>
    </div>
  )
}

/** The SMS module's settings: the message and the number it goes to. */
export function SmsSettings({ node }: { node: SelectedPart }) {
  const { t } = useI18n()
  const updatePart = useCircuit((s) => s.updatePart)
  const { id, data } = node
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{t.radio.message}</p>
        <TextBox
          value={data.text ?? t.radio.defaultMessage}
          label={t.radio.message}
          multiline
          maxLength={160}
          onChange={(text) => updatePart(id, { text }, { history: false })}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">{t.radio.messageHint}</p>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{t.radio.phone}</p>
        <TextBox
          value={data.phone ?? DEFAULT_PHONE}
          label={t.radio.phone}
          maxLength={20}
          ltr
          onChange={(phone) => updatePart(id, { phone }, { history: false })}
        />
      </div>
    </div>
  )
}
