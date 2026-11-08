/**
 * Tiny Web Audio synth: no audio files, everything is generated.
 * The context is created lazily on the first user gesture (autoplay policy).
 */

type Voice = { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode }

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true
let buzzer: Voice | null = null
let motor: Voice | null = null
let speaker: Voice | null = null
let sizzle: { source: AudioBufferSourceNode; gain: GainNode } | null = null

function context(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = enabled ? 1 : 0
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/**
 * Plays sine tones together for `seconds`, `delay` seconds from now: a DTMF
 * key is two tones (697 Hz + 1209 Hz for "1"), a dial tone one. Call it from
 * a click so the browser allows the sound.
 */
export function playTones(freqs: number[], seconds: number, delay = 0) {
  const ac = context()
  if (!ac || !master || !freqs.length) return
  const start = ac.currentTime + delay
  const level = 0.16 / freqs.length
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(level, start + 0.012)
  gain.gain.setValueAtTime(level, Math.max(start + 0.012, start + seconds - 0.02))
  gain.gain.linearRampToValueAtTime(0, start + seconds)
  gain.connect(master)
  for (const frequency of freqs) {
    const osc = ac.createOscillator()
    osc.frequency.value = frequency
    osc.connect(gain)
    osc.start(start)
    osc.stop(start + seconds + 0.05)
  }
}

/** Call from a user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  context()
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  if (ctx && master) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.05)
}

function noiseBuffer(ac: AudioContext, seconds: number) {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function continuousVoice(
  current: Voice | null,
  level: number,
  build: (ac: AudioContext) => Voice,
  apply: (voice: Voice, level: number, ac: AudioContext) => void,
): Voice | null {
  const ac = ctx
  if (!ac || !master) return current
  if (level <= 0) {
    if (current) current.gain.gain.setTargetAtTime(0, ac.currentTime, 0.04)
    return current
  }
  const voice = current ?? build(ac)
  apply(voice, level, ac)
  return voice
}

/** Active buzzer: a slightly warbling beep, louder with more current. */
export function setBuzzerLevel(level: number) {
  buzzer = continuousVoice(
    buzzer,
    level,
    (ac) => {
      const osc = ac.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 1320
      const lfo = ac.createOscillator()
      lfo.frequency.value = 9
      const lfoGain = ac.createGain()
      lfoGain.gain.value = 40
      lfo.connect(lfoGain).connect(osc.frequency)
      const filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2600
      const gain = ac.createGain()
      gain.gain.value = 0
      osc.connect(filter).connect(gain).connect(master!)
      osc.start()
      lfo.start()
      return { osc, gain, lfo }
    },
    (voice, value, ac) => {
      voice.gain.gain.setTargetAtTime(0.05 * Math.min(1.4, value), ac.currentTime, 0.03)
      voice.osc.frequency.setTargetAtTime(1150 + 220 * Math.min(1.5, value), ac.currentTime, 0.05)
    },
  )
}

/** Motor hum: a low saw wave whose pitch follows the speed. */
export function setMotorLevel(level: number) {
  motor = continuousVoice(
    motor,
    level,
    (ac) => {
      const osc = ac.createOscillator()
      osc.type = 'sawtooth'
      const filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 420
      const gain = ac.createGain()
      gain.gain.value = 0
      osc.connect(filter).connect(gain).connect(master!)
      osc.start()
      return { osc, gain }
    },
    (voice, value, ac) => {
      voice.osc.frequency.setTargetAtTime(48 + 95 * Math.min(2.2, value), ac.currentTime, 0.25)
      voice.gain.gain.setTargetAtTime(0.022 * Math.min(1.6, value), ac.currentTime, 0.15)
    },
  )
}

/** Speaker: a clear, round note at `pitch` hertz, louder with more power. */
export function setSpeakerTone(level: number, pitch: number) {
  speaker = continuousVoice(
    speaker,
    level,
    (ac) => {
      const osc = ac.createOscillator()
      // a triangle wave sounds like a soft flute: kind to small ears
      osc.type = 'triangle'
      osc.frequency.value = pitch
      const gain = ac.createGain()
      gain.gain.value = 0
      osc.connect(gain).connect(master!)
      osc.start()
      return { osc, gain }
    },
    (voice, value, ac) => {
      voice.osc.frequency.setTargetAtTime(pitch, ac.currentTime, 0.02)
      voice.gain.gain.setTargetAtTime(0.07 * Math.min(1.5, value), ac.currentTime, 0.02)
    },
  )
}

/** The three sounds of a buzzer's siren chip. */
export type SirenSound = 'wail' | 'yelp' | 'hilo'

/** A police siren sweeps between these pitches, in hertz. */
const SIREN_LOW = 650
const SIREN_HIGH = 1500
/** The pitch curve's own sample rate: plenty for a pitch that moves a few times a second. */
const CURVE_RATE = 22050

type Siren = {
  osc: OscillatorNode
  sweep: AudioBufferSourceNode
  gain: GainNode
  sound: SirenSound
  /** true while it is quiet, so the next start spins up from the bottom */
  silent: boolean
}
let siren: Siren | null = null
const sirenCurves = new Map<SirenSound, AudioBuffer>()

/** 0 → 1, fast at first and slower near the top, like a siren motor spinning up. */
const spinUp = (x: number, k: number) => (1 - Math.exp(-k * x)) / (1 - Math.exp(-k))

/**
 * One cycle of the siren's pitch in hertz:
 * - wail: up in 2 s, down in 2.6 s — the long police "wooo-iiii-ooo"
 * - yelp: the same sweep about three times a second, for busy traffic
 * - hilo: two notes in turn, "nee-naw"
 */
function sirenCurve(sound: SirenSound) {
  if (sound === 'hilo') {
    const note = Math.round(0.6 * CURVE_RATE)
    const glide = Math.round(0.015 * CURVE_RATE)
    const curve = new Float32Array(note * 2)
    for (let i = 0; i < curve.length; i++) {
      const high = i < note
      const [from, to] = high ? [770, 960] : [960, 770]
      curve[i] = from + (to - from) * Math.min(1, (i % note) / glide)
    }
    return curve
  }
  const [up, down] = sound === 'wail' ? [2, 2.6] : [0.17, 0.13]
  const curve = new Float32Array(Math.round((up + down) * CURVE_RATE))
  const span = SIREN_HIGH - SIREN_LOW
  for (let i = 0; i < curve.length; i++) {
    const t = i / CURVE_RATE
    curve[i] = t < up ? SIREN_LOW + span * spinUp(t / up, 2.4) : SIREN_HIGH - span * spinUp((t - up) / down, 1.2)
  }
  return curve
}

/**
 * The pitch curve as a looping audio source. It feeds the oscillator's
 * frequency directly, so the sweep stays perfectly smooth even when the
 * page is busy.
 */
function sirenSweep(ac: AudioContext, sound: SirenSound) {
  let buffer = sirenCurves.get(sound)
  if (!buffer) {
    const curve = sirenCurve(sound)
    buffer = ac.createBuffer(1, curve.length, CURVE_RATE)
    buffer.copyToChannel(curve, 0)
    sirenCurves.set(sound, buffer)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

/** A short street echo: a tail of reflections plus one clear bounce off a building. */
function streetEcho(ac: AudioContext) {
  const length = Math.floor(ac.sampleRate * 1.6)
  const buffer = ac.createBuffer(2, length, ac.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / ac.sampleRate / 0.3) * 0.5
    data[Math.floor(ac.sampleRate * (channel ? 0.135 : 0.118))] += 0.7
  }
  return buffer
}

/**
 * A buzzer with a siren chip inside, like a police car's: a square wave whose
 * pitch sweeps up and down, shaped like a horn speaker (no deep bass, a bright
 * bite around 2 kHz) and echoing a little, as it would down a street.
 */
export function setSiren(level: number, sound: SirenSound) {
  const ac = ctx
  if (!ac || !master) return
  if (level <= 0) {
    if (siren && !siren.silent) {
      siren.gain.gain.setTargetAtTime(0, ac.currentTime, 0.06)
      siren.silent = true
    }
    return
  }
  if (!siren) {
    const osc = ac.createOscillator()
    osc.type = 'square'
    // the sweep adds the whole pitch on top of 0 Hz
    osc.frequency.value = 0
    const highpass = ac.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 420
    const horn = ac.createBiquadFilter()
    horn.type = 'peaking'
    horn.frequency.value = 1900
    horn.Q.value = 0.8
    horn.gain.value = 6
    const lowpass = ac.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 5200
    const gain = ac.createGain()
    gain.gain.value = 0
    osc.connect(highpass).connect(horn).connect(lowpass).connect(gain).connect(master)
    const echo = ac.createConvolver()
    echo.buffer = streetEcho(ac)
    const wet = ac.createGain()
    wet.gain.value = 0.25
    gain.connect(echo).connect(wet).connect(master)
    const sweep = sirenSweep(ac, sound)
    sweep.connect(osc.frequency)
    osc.start()
    sweep.start()
    siren = { osc, sweep, gain, sound, silent: false }
  } else if (siren.silent || siren.sound !== sound) {
    // a new sound, or switched on again: start the sweep from the bottom, like a real siren
    siren.sweep.stop()
    siren.sweep.disconnect()
    siren.sweep = sirenSweep(ac, sound)
    siren.sweep.connect(siren.osc.frequency)
    siren.sweep.start()
    siren.sound = sound
  }
  siren.silent = false
  siren.gain.gain.setTargetAtTime(0.045 * Math.min(1.4, level), ac.currentTime, 0.03)
}

/** Crackling noise while a battery is short-circuited. */
export function setSizzle(on: boolean) {
  const ac = ctx
  if (!ac || !master) return
  if (on && !sizzle) {
    const source = ac.createBufferSource()
    source.buffer = noiseBuffer(ac, 2)
    source.loop = true
    const filter = ac.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3200
    filter.Q.value = 0.8
    const gain = ac.createGain()
    gain.gain.value = 0
    gain.gain.setTargetAtTime(0.05, ac.currentTime, 0.05)
    source.connect(filter).connect(gain).connect(master)
    source.start()
    sizzle = { source, gain }
  } else if (!on && sizzle) {
    const { source, gain } = sizzle
    gain.gain.setTargetAtTime(0, ac.currentTime, 0.05)
    source.stop(ac.currentTime + 0.3)
    sizzle = null
  }
}

function blip(frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0) {
  const ac = context()
  if (!ac || !master) return
  const start = ac.currentTime + delay
  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(master)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Mechanical click for switches and buttons. */
export function playClick(on = true) {
  blip(on ? 1900 : 1300, 0.05, 'square', 0.06)
  blip(on ? 260 : 200, 0.07, 'triangle', 0.08)
}

/** A part burning out: a pop with a falling pitch and a puff of noise. */
export function playPop() {
  const ac = context()
  if (!ac || !master) return
  const now = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(700, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.3)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.25, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
  osc.connect(gain).connect(master)
  osc.start(now)
  osc.stop(now + 0.4)

  const noise = ac.createBufferSource()
  noise.buffer = noiseBuffer(ac, 0.4)
  const noiseGain = ac.createGain()
  noiseGain.gain.setValueAtTime(0.18, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  noise.connect(noiseGain).connect(master)
  noise.start(now)
}

/** Happy arpeggio for completed missions. */
export function playSuccess() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => blip(f, 0.32, 'triangle', 0.09, i * 0.09))
}

/** Soft pluck when a part is placed or a wire is connected. */
export function playPlace() {
  blip(880, 0.12, 'sine', 0.07)
  blip(1320, 0.1, 'sine', 0.04, 0.04)
}

let bell: Voice | null = null
let beep: Voice | null = null

/**
 * Electric bell: two bright, slightly out-of-tune partials of a metal gong,
 * struck again and again. A falling sawtooth gives each strike a sharp start
 * and a ringing fade; more current strikes faster and louder.
 */
export function setBellLevel(level: number) {
  bell = continuousVoice(
    bell,
    level,
    (ac) => {
      const strike = ac.createGain()
      strike.gain.value = 0.5
      const gain = ac.createGain()
      gain.gain.value = 0
      const osc = ac.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 1420
      const partial = ac.createOscillator()
      partial.type = 'sine'
      partial.frequency.value = 2370
      const partialGain = ac.createGain()
      partialGain.gain.value = 0.45
      osc.connect(strike)
      partial.connect(partialGain).connect(strike)
      strike.connect(gain).connect(master!)
      const lfo = ac.createOscillator()
      lfo.type = 'sawtooth'
      lfo.frequency.value = 6
      const depth = ac.createGain()
      // falling: loudest at the start of each strike
      depth.gain.value = -0.5
      lfo.connect(depth).connect(strike.gain)
      osc.start()
      partial.start()
      lfo.start()
      return { osc, gain, lfo }
    },
    (voice, value, ac) => {
      voice.gain.gain.setTargetAtTime(0.045 * Math.min(1.5, value), ac.currentTime, 0.03)
      voice.lfo?.frequency.setTargetAtTime(4.3 + 1.7 * Math.min(1.5, value), ac.currentTime, 0.1)
    },
  )
}

/** The multimeter's continuity beep: a steady, clear tone while its probes find a joined path. */
export function setContinuityBeep(on: boolean) {
  beep = continuousVoice(
    beep,
    on ? 1 : 0,
    (ac) => {
      const osc = ac.createOscillator()
      osc.type = 'square'
      osc.frequency.value = 2700
      const filter = ac.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 3600
      const gain = ac.createGain()
      gain.gain.value = 0
      osc.connect(filter).connect(gain).connect(master!)
      osc.start()
      return { osc, gain }
    },
    (voice, _value, ac) => voice.gain.gain.setTargetAtTime(0.03, ac.currentTime, 0.01),
  )
}

/** A solenoid's rod hitting its stop: a dull thunk out, a softer one back in. */
export function playClack(out = true) {
  blip(out ? 150 : 110, 0.09, 'triangle', out ? 0.16 : 0.1)
  blip(out ? 2400 : 1800, 0.025, 'square', 0.04)
}

export function stopContinuousSounds() {
  setBellLevel(0)
  setContinuityBeep(false)
  setBuzzerLevel(0)
  setSiren(0, 'wail')
  setMotorLevel(0)
  setSpeakerTone(0, 0)
  setSizzle(false)
}
