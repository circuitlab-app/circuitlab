import { BOARDS, SENSOR_MODES, type BoardType } from './catalog'
import type { PinMode } from './types'

/** Raspberry Pi: the gpiozero call for each pin program … */
const PI_PROGRAM: Partial<Record<PinMode, string>> = {
  on: 'on()',
  blink: 'blink(on_time=0.5, off_time=0.5)',
  blink2: 'blink(on_time=0.5, off_time=0.5)',
  step1: 'blink(on_time=1, off_time=2)',
  step2: 'blink(on_time=1, off_time=2)',
  step3: 'blink(on_time=1, off_time=2)',
  fade: 'pulse(fade_in_time=1, fade_out_time=1)',
}

/** … and how many seconds after the others it starts, so pins take turns. */
const PI_START: Partial<Record<PinMode, number>> = { blink2: 0.5, step2: 1, step3: 2 }

/**
 * The program a real board needs to do what its pins are set to, in the
 * language that board uses: Arduino C++ (also the car's ECU), MicroPython
 * (Pico, micro:bit), Python with gpiozero (Raspberry Pi) or IEC 61131-3
 * Structured Text (the factory PLC and the oil well's RTU). Real code kids can copy.
 */
export function boardCode(type: BoardType, pins: Record<string, PinMode>): string {
  const spec = BOARDS[type]
  const used = spec.pins.filter((p) => (pins[p] ?? 'off') !== 'off')
  const pick = (...modes: PinMode[]) => used.filter((p) => modes.includes(pins[p]))
  const n = spec.codeName
  const input = spec.input ? spec.codeName(spec.input) : ''
  const sensing = pick(...SENSOR_MODES).length > 0
  const stepping = pick('step1', 'step2', 'step3')
  /** 0, 1 or 2: the second of the 3-second loop in which a step pin is on */
  const stepOf = (p: string) => Number(pins[p].slice(4)) - 1
  /** a pin that copies the sensor smoothly needs PWM */
  const smooth = (p: string) => pins[p] === 'fade' || ((pins[p] === 'follow' || pins[p] === 'invert') && spec.pwm.has(p))

  switch (spec.language) {
    case 'arduino': {
      const max = spec.adcMax
      const half = Math.round(max / 2)
      const scale = Math.round((max + 1) / 256)
      const lines = ['void setup() {', ...used.map((p) => `  pinMode(${n(p)}, OUTPUT);`), '}', '', 'void loop() {']
      if (used.length === 0) lines.push('  // every pin is off')
      if (sensing) lines.push(`  int reading = analogRead(${input});  // 0 … ${max}`)
      for (const p of pick('on')) lines.push(`  digitalWrite(${n(p)}, HIGH);`)
      for (const p of pick('follow')) {
        lines.push(
          spec.pwm.has(p)
            ? `  analogWrite(${n(p)}, reading / ${scale});`
            : `  digitalWrite(${n(p)}, reading > ${half} ? HIGH : LOW);`,
        )
      }
      for (const p of pick('invert')) {
        lines.push(
          spec.pwm.has(p)
            ? `  analogWrite(${n(p)}, 255 - reading / ${scale});`
            : `  digitalWrite(${n(p)}, reading > ${half} ? LOW : HIGH);`,
        )
      }
      if (pick('alarm').length > 0) {
        lines.push(`  int beat = map(reading, ${half}, ${max}, 600, 200);  // faster when higher`)
        for (const p of pick('alarm')) {
          lines.push(`  digitalWrite(${n(p)}, reading > ${half} && millis() % beat < beat / 2 ? HIGH : LOW);`)
        }
      }
      if (pick('blink', 'blink2').length > 0) {
        lines.push('  bool blink = millis() % 1000 < 500;')
        for (const p of pick('blink')) lines.push(`  digitalWrite(${n(p)}, blink ? HIGH : LOW);`)
        for (const p of pick('blink2')) lines.push(`  digitalWrite(${n(p)}, blink ? LOW : HIGH);`)
      }
      if (stepping.length > 0) {
        lines.push('  int step = millis() / 1000 % 3;  // 0, 1, 2, 0, 1, 2 …')
        for (const p of stepping) lines.push(`  digitalWrite(${n(p)}, step == ${stepOf(p)} ? HIGH : LOW);`)
      }
      if (pick('fade').length > 0) {
        lines.push('  int level = (1 - cos(PI * millis() / 1000.0)) * 127.5;')
        for (const p of pick('fade')) lines.push(`  analogWrite(${n(p)}, level);`)
      }
      lines.push('}')
      return lines.join('\n')
    }
    case 'micropython-pico': {
      const lines = ['from machine import Pin, PWM, ADC', 'import time, math', '']
      for (const p of used) {
        lines.push(smooth(p) ? `p${n(p)} = PWM(Pin(${n(p)})); p${n(p)}.freq(1000)` : `p${n(p)} = Pin(${n(p)}, Pin.OUT)`)
      }
      if (sensing) lines.push(`sensor = ADC(${input})`)
      lines.push('', 'while True:', '    t = time.ticks_ms()')
      if (used.length === 0) lines.push('    pass  # every pin is off')
      if (sensing) lines.push('    r = sensor.read_u16()  # 0 … 65535')
      for (const p of pick('on')) lines.push(`    p${n(p)}.value(1)`)
      for (const p of pick('blink')) lines.push(`    p${n(p)}.value(t % 1000 < 500)`)
      for (const p of pick('blink2')) lines.push(`    p${n(p)}.value(t % 1000 >= 500)`)
      if (stepping.length > 0) lines.push('    step = t // 1000 % 3')
      for (const p of stepping) lines.push(`    p${n(p)}.value(step == ${stepOf(p)})`)
      for (const p of pick('fade')) lines.push(`    p${n(p)}.duty_u16(int((1 - math.cos(math.pi * t / 1000)) * 32767))`)
      for (const p of pick('follow')) lines.push(smooth(p) ? `    p${n(p)}.duty_u16(r)` : `    p${n(p)}.value(r > 32768)`)
      for (const p of pick('invert')) lines.push(smooth(p) ? `    p${n(p)}.duty_u16(65535 - r)` : `    p${n(p)}.value(r <= 32768)`)
      if (pick('alarm').length > 0) lines.push('    beat = 600 - (r - 32768) * 400 // 32767')
      for (const p of pick('alarm')) lines.push(`    p${n(p)}.value(r > 32768 and t % beat < beat // 2)`)
      return lines.join('\n')
    }
    case 'micropython-microbit': {
      const lines = ['from microbit import *', 'import math', '', 'while True:', '    t = running_time()']
      if (used.length === 0) lines.push('    pass  # every pin is off')
      if (sensing) lines.push(`    r = ${input}.read_analog()  # 0 … 1023`)
      for (const p of pick('on')) lines.push(`    ${n(p)}.write_digital(1)`)
      for (const p of pick('blink')) lines.push(`    ${n(p)}.write_digital(1 if t % 1000 < 500 else 0)`)
      for (const p of pick('blink2')) lines.push(`    ${n(p)}.write_digital(0 if t % 1000 < 500 else 1)`)
      if (stepping.length > 0) lines.push('    step = t // 1000 % 3')
      for (const p of stepping) lines.push(`    ${n(p)}.write_digital(1 if step == ${stepOf(p)} else 0)`)
      for (const p of pick('fade')) lines.push(`    ${n(p)}.write_analog(int((1 - math.cos(math.pi * t / 1000)) * 511))`)
      for (const p of pick('follow')) lines.push(`    ${n(p)}.write_analog(r)`)
      for (const p of pick('invert')) lines.push(`    ${n(p)}.write_analog(1023 - r)`)
      if (pick('alarm').length > 0) lines.push('    beat = 600 - (r - 512) * 400 // 511')
      for (const p of pick('alarm')) lines.push(`    ${n(p)}.write_digital(1 if r > 512 and t % beat < beat // 2 else 0)`)
      return lines.join('\n')
    }
    case 'python': {
      // gpiozero blinks and fades by itself: pins that take turns simply start later
      const order = [...used].sort((a, b) => (PI_START[pins[a]] ?? 0) - (PI_START[pins[b]] ?? 0))
      const waits = order.some((p) => (PI_START[pins[p]] ?? 0) > 0)
      const lines = ['from gpiozero import LED, PWMLED', 'from signal import pause', ...(waits ? ['from time import sleep'] : []), '']
      for (const p of order) lines.push(`led${n(p)} = ${pins[p] === 'fade' ? 'PWMLED' : 'LED'}(${n(p)})`)
      lines.push(used.length === 0 ? '# every pin is off' : '')
      let now = 0
      for (const p of order) {
        const start = PI_START[pins[p]] ?? 0
        if (start > now) {
          lines.push(`sleep(${start - now})  # wait for its turn`)
          now = start
        }
        lines.push(`led${n(p)}.${PI_PROGRAM[pins[p]] ?? 'off()'}`)
      }
      lines.push('', 'pause()')
      return lines.join('\n')
    }
    case 'iec-st': {
      // IEC 61131-3 Structured Text, the way PLCs and RTUs are programmed: each output is
      // named and placed at its address, digital ones (%QX) are TRUE or FALSE, analog ones (%QW) a number
      const max = spec.adcMax
      const half = Math.round(max / 2)
      const analog = (p: string) => spec.pwm.has(p)
      const address: Record<string, string> = {}
      let bits = 0
      let words = 0
      for (const p of spec.pins) address[p] = analog(p) ? `%QW${2 * words++}` : `%QX0.${bits++}`
      const alarm = pick('alarm').length > 0
      const lines = [
        'PROGRAM Main',
        'VAR',
        ...used.map((p) => `    ${n(p)} AT ${address[p]} : ${analog(p) ? 'INT' : 'BOOL'};`),
        ...(sensing ? [`    ${input} AT %IW0 : INT;  (* 0 … ${max} *)`] : []),
        '    ms : UDINT;  (* milliseconds since the PLC started *)',
        ...(stepping.length > 0 ? ['    step : UDINT;'] : []),
        ...(alarm ? ['    beat : UDINT;'] : []),
        'END_VAR',
        '',
        'ms := TIME_TO_UDINT(TIME());',
      ]
      if (used.length === 0) lines.push('(* every output is off *)')
      if (stepping.length > 0) lines.push('step := (ms / 1000) MOD 3;  (* 0, 1, 2, 0, 1, 2 … *)')
      if (alarm) lines.push(`beat := 600 - INT_TO_UDINT(MAX(${input} - ${half}, 0)) * 400 / ${max - half};  (* faster when higher *)`)
      /** a TRUE / FALSE rule, written into a digital output, or into an analog one as 0 or full scale */
      const set = (p: string, rule: string) => lines.push(analog(p) ? `${n(p)} := SEL(${rule}, 0, ${max});` : `${n(p)} := ${rule};`)
      for (const p of used) {
        const mode = pins[p]
        if (mode === 'on') set(p, 'TRUE')
        else if (mode === 'blink') set(p, '(ms MOD 1000) < 500')
        else if (mode === 'blink2') set(p, '(ms MOD 1000) >= 500')
        else if (mode === 'step1' || mode === 'step2' || mode === 'step3') set(p, `step = ${stepOf(p)}`)
        else if (mode === 'fade') lines.push(`${n(p)} := REAL_TO_INT((1.0 - COS(3.14159 * UDINT_TO_REAL(ms) / 1000.0)) * ${half}.0);`)
        else if (mode === 'follow') {
          if (analog(p)) lines.push(`${n(p)} := ${input};`)
          else set(p, `${input} > ${half}`)
        } else if (mode === 'invert') {
          if (analog(p)) lines.push(`${n(p)} := ${max} - ${input};`)
          else set(p, `${input} <= ${half}`)
        } else if (mode === 'alarm') set(p, `${input} > ${half} AND (ms MOD beat) < beat / 2`)
      }
      lines.push('', 'END_PROGRAM')
      return lines.join('\n')
    }
  }
}
