import type { TelecomBook } from './types'

const round = (n: number) => Math.round(n)
const forms = { analog: 'analog voltage', digital: 'bits', rf: 'an RF signal', radio: 'a radio wave', light: 'light' } as const

export const enTelecom: TelecomBook = {
  title: 'Telecom Lab',
  modes: { call: 'Call journey', scope: 'Modulation', map: 'Towers & coverage', guide: 'Generations & guide' },
  techs: {
    landline: 'Landline',
    '2g': '2G · GSM',
    '3g': '3G · UMTS',
    '4g': '4G · LTE',
    '5g': '5G · NR',
    walkie: 'Direct radio (walkie-talkie)',
  },
  forms: {
    analog: { name: 'Analog', hint: 'a voltage shaped like the sound wave' },
    digital: { name: 'Bits', hint: 'numbers: zeros and ones' },
    rf: { name: 'RF', hint: 'a radio-frequency signal in a cable' },
    radio: { name: 'Radio wave', hint: 'an electromagnetic wave in the air' },
    light: { name: 'Light', hint: 'flashes of light in a glass fibre' },
  },
  parts: {
    mic: {
      name: 'Microphone',
      does: 'Sound → voltage',
      inside: 'A thin membrane moves with the air; a coil, a capacitor or, in old phones, carbon grains turn that movement into a changing voltage.',
    },
    adc: {
      name: 'ADC',
      does: 'Voltage → bits',
      inside: 'The analog-to-digital converter measures the voltage 8,000 times a second (enough for a voice) and writes each measurement as a number.',
    },
    codec: {
      name: 'Voice codec',
      does: 'Squeezes the voice',
      inside: 'It models how a voice is made and sends only the model’s settings: about 12 kbit/s instead of 64, so far more calls fit in the air. The other side rebuilds the voice.',
    },
    modulator: {
      name: 'Modulator',
      does: 'Bits → radio signal',
      inside: 'It writes each group of bits onto a carrier wave by setting its amplitude and phase (GMSK, QPSK, QAM …). See the Modulation section.',
    },
    amplifier: {
      name: 'Amplifier',
      does: 'Makes it stronger',
      inside: 'Sending, a power amplifier (PA) gives the signal the strength to reach the tower. Receiving, a low-noise amplifier (LNA) lifts the faint signal from the antenna without adding much noise.',
    },
    antenna: {
      name: 'Antenna',
      does: 'Signal ↔ radio wave',
      inside: 'A piece of metal sized to the frequency. Current moving in it radiates a wave; a passing wave makes a tiny current in it.',
    },
    air: {
      name: 'Air',
      does: 'The radio wave travels',
      inside: 'The wave spreads out and weakens with distance, walls, trees and rain. Higher frequencies weaken faster and get through walls worse.',
    },
    tower: {
      name: 'Cell tower',
      does: 'Radio ↔ network',
      inside: 'Antennas on a mast plus a base station (BTS, NodeB, eNodeB or gNodeB) that talks to every phone in its cell and to the network over the backhaul.',
    },
    fiber: {
      name: 'Fibre',
      does: 'Light over long distances',
      inside: 'A hair-thin glass thread. Light flashes bounce along inside it (total internal reflection) for tens of kilometres with little loss.',
    },
    core: {
      name: 'Core network',
      does: 'Finds and connects',
      inside: 'The operator’s computers: they check the SIM, keep track of which cell each phone is in, connect calls, count them for the bill and link to the internet.',
    },
    demodulator: {
      name: 'Demodulator',
      does: 'Radio signal → bits',
      inside: 'It measures the amplitude and phase of each symbol and picks the nearest point of the constellation: those are the bits.',
    },
    dac: {
      name: 'DAC',
      does: 'Bits → voltage',
      inside: 'The digital-to-analog converter turns the stream of numbers back into a smoothly changing voltage.',
    },
    speaker: {
      name: 'Speaker',
      does: 'Voltage → sound',
      inside: 'Current in a coil next to a magnet pushes a cone back and forth; the cone moves the air, and that is sound.',
    },
    copper: {
      name: 'Copper pair',
      does: 'The phone line',
      inside: 'Two twisted copper wires from your home to the exchange; the twist cancels interference. The line’s power and your voice share the same two wires.',
    },
    exchange: {
      name: 'Exchange',
      does: 'Switches the call',
      inside: 'The telephone exchange powers your line with 48 V, hears the number you dial, turns the voice into 64 kbit/s of bits and connects it to the right line.',
    },
  },
  zones: { phoneA: 'Your phone', phoneB: 'Their phone', network: 'Operator network', line: 'Phone line', air: 'Air' },
  walls: (n) => (n === 1 ? '1 wall' : `${n} walls`),

  call: {
    tech: 'Network',
    call: 'Call',
    pause: 'Pause',
    again: 'Call again',
    prev: 'Back',
    next: 'Next',
    reset: 'Rebuild',
    panels: { call: 'Call', part: 'Part', tray: 'Add parts' },
    ok: 'The circuit works: your voice reaches the speaker.',
    failed: 'The call does not get through',
    pick: 'Click a part to see what it does and change it.',
    phases: {
      offhook: 'Off the hook',
      dial: 'Dialling',
      ring: 'Ringing',
      setup: 'Call set-up',
      page: 'Paging',
      push: 'Push to talk',
      talk: 'Your voice on its way',
      fail: 'The call fails',
    },
    say: {
      offhook: () =>
        'Lifting the handset closes the loop: the exchange’s 48 V makes a current flow through the phone, the exchange notices and plays a dial tone.',
      dial: () =>
        'Each key sends two tones at once (DTMF), for example 5 = 770 Hz + 1336 Hz. The exchange hears the number and picks a route to the other exchange.',
      ring: () =>
        'The far exchange sends about 75–90 V of alternating current at 20–25 Hz down the other line: that is what rings the bell. Picking up answers the call.',
      setup: (_tech, radio) =>
        `Your phone asks the tower (${radio.tower}) for a channel. The core network (${radio.core}) checks your SIM and looks up which cell the other phone is in.`,
      page: () =>
        'The network pages the other phone through the towers of its area. The phone answers, gets a channel of its own and starts ringing.',
      push: () =>
        'Pressing the talk button: one radio sends, every radio on the same channel hears it. No tower, no network, so only within range.',
    },
    hop: ({ hop, radio, km, walls }) => {
      switch (hop.kind) {
        case 'mic':
          return 'The microphone turns your voice, waves of air pressure, into a tiny changing voltage: an analog copy of the sound.'
        case 'copper':
          return `The copper pair carries that voltage ${km} km to the exchange. The exchange powers the phone over the same wires.`
        case 'exchange':
          return hop.from === 'analog'
            ? 'The exchange samples the voice 8,000 times a second at 8 bits (64 kbit/s), and switches those bits onto a fibre towards the other exchange.'
            : 'The other exchange turns the bits back into a voltage and sends it down the other person’s copper pair.'
        case 'adc':
          return 'The ADC measures the voltage 8,000 times a second and writes each measurement as a number: your voice is now bits.'
        case 'codec':
          return `The voice codec (${radio.codec}) packs the voice into about ${radio.kbps} kbit/s, keeping what the ear needs; on the far side the same codec rebuilds it.`
        case 'modulator':
          return `The modulator writes the bits onto a ${radio.mhz} MHz carrier with ${radio.modulation}: each group of bits becomes one amplitude and phase of the wave.`
        case 'amplifier':
          return hop.from === 'rf'
            ? 'The amplifier makes the radio signal strong enough to travel, or, after a receiving antenna, lifts the faint signal above the noise.'
            : 'The amplifier strengthens the signal.'
        case 'antenna':
          return hop.from === 'rf'
            ? 'The antenna turns the electrical signal into a radio wave that spreads out through the air.'
            : 'The antenna catches a tiny part of the radio wave and turns it back into an electrical signal.'
        case 'air':
          return `The radio wave travels ${km} km${walls ? ` through ${walls === 1 ? 'one wall' : `${walls} walls`}` : ''} and arrives at ${round(hop.dbm ?? 0)} dBm (${hop.bars ?? 0} of 4 bars). Distance and walls weaken it.`
        case 'tower':
          return hop.from === 'radio'
            ? `The tower’s base station (${radio.tower}) picks up your signal, turns it back into bits and sends them into the operator’s network over fibre.`
            : `A tower near the other person (${radio.tower}) sends the call to their phone as a radio wave.`
        case 'fiber':
          return `The fibre carries the call as flashes of light over ${km} km, at about 200,000 km per second.`
        case 'core':
          return `The core network (${radio.core}) knows which tower the other phone is under and connects the two. In 4G and 5G the voice travels as internet packets (VoLTE, VoNR).`
        case 'demodulator':
          return `The demodulator measures the amplitude and phase of each symbol and turns them back into bits (${radio.modulation}).`
        case 'dac':
          return 'The DAC turns the numbers back into a smoothly changing voltage.'
        case 'speaker':
          return 'The speaker turns the voltage into moving air: the other person hears your voice. Their reply comes back the same way, in the other direction.'
      }
    },
    problem: (p, name) => {
      switch (p.code) {
        case 'noMic':
          return 'There is no microphone: every call starts with one.'
        case 'wrongInput':
          return p.wants.length
            ? `The ${name(p.kind)} needs ${p.wants.map((f) => forms[f]).join(' or ')} but gets ${forms[p.got]}. Something that turns one into the other is missing before it.`
            : `Nothing can go into the ${name(p.kind)}: it is where a call starts.`
        case 'off':
          return `The ${name(p.kind)} is switched off or cut: the signal stops here.`
        case 'deadEnd':
          return `The signal leaves the ${name(p.kind)} as ${forms[p.form]} but goes nowhere. Wire it to the next part.`
        case 'loop':
          return 'The wires go round in a circle and never reach a speaker.'
        case 'noSignal':
          return `Too weak: ${round(p.dbm)} dBm arrives after ${p.km} km, but at least ${round(p.need)} dBm is needed. Come closer, remove walls, add an amplifier or use a lower frequency (2G reaches further than 5G).`
        case 'noCore':
          return 'Two towers cannot connect a call on their own: the core network has to find the other phone and join the two. Put the core network between them.'
        case 'longLine':
          return `${p.km} km of copper is too long: the voice fades away. Real lines stay under about 8 km; longer distances use fibre.`
      }
    },
    note: (n) => {
      switch (n.code) {
        case 'noCodec':
          return 'No voice codec: the voice takes 64 kbit/s instead of about 12, so a tower can carry about five times fewer calls.'
        case 'weak':
          return `Weak signal (${round(n.dbm)} dBm): the voice may break up.`
        case 'noAmp':
          return 'No power amplifier before the sending antenna: it is only heard very close by.'
        case 'noLna':
          return 'No amplifier after the receiving antenna: faint signals get lost in the noise.'
      }
    },
    signal: (dbm, bars) => `${round(dbm)} dBm · ${bars}/4`,
    length: 'Length',
    working: 'Working',
    remove: 'Remove part',
    takesGives: 'Takes → gives',
    trayHint: 'Add a part, then drag from its dot on the right to the next part’s dot on the left to wire them.',
    connectHint: 'Select a wire or a part and press Delete to remove it.',
  },

  scope: {
    scheme: 'Modulation',
    schemes: {
      am: { name: 'AM', used: 'AM radio (medium wave)' },
      fm: { name: 'FM', used: 'FM radio, 1G phones, walkie-talkies' },
      ask: { name: 'ASK (on–off)', used: 'remote controls, simple sensors' },
      fsk: { name: 'FSK · GMSK', used: '2G GSM uses GMSK, a smooth kind of FSK' },
      bpsk: { name: 'BPSK', used: 'GPS, links to space probes' },
      qpsk: { name: 'QPSK', used: '3G, and 4G/5G when the signal is weak' },
      '8psk': { name: '8PSK', used: 'EDGE: the “E” on 2G phones' },
      '16qam': { name: '16-QAM', used: 'HSPA (H), 4G' },
      '64qam': { name: '64-QAM', used: 'HSPA+ (H+), 4G, Wi-Fi' },
      '256qam': { name: '256-QAM', used: 'LTE-Advanced (4G+), 5G, Wi-Fi' },
    },
    text: 'Message',
    snr: 'Signal vs noise',
    snrHint: 'Lower means a weaker signal: further from the tower, or more walls.',
    noise: 'New noise',
    message: 'What is sent',
    carrier: 'Carrier wave',
    signal: 'Modulated signal (with noise)',
    constellation: 'Constellation',
    sent: 'Sent',
    received: 'Received',
    errors: (wrong, total) => `${wrong} of ${total} bits wrong`,
    bitsPerSymbol: (n) => `${n} bit${n === 1 ? '' : 's'} per symbol`,
    speed: (mbps) => `In a 20 MHz channel: about ${round(mbps)} Mbit/s`,
    analog:
      'AM and FM carry the sound wave itself, not bits: AM changes the wave’s strength, FM its frequency. Noise is simply heard as hiss.',
    tip: 'Each dot is one point the receiver can tell apart. More points means more bits per symbol and more speed, but they sit closer together, so less noise is enough to mix them up. Phones switch between them all the time as the signal changes.',
  },

  map: {
    hint: 'Drag the phone or a tower; click a tower to change it. The colours show the newest network you would get there.',
    phone: 'Your phone',
    noService: 'No service',
    serving: 'Tower',
    distance: 'Distance',
    walls: 'Walls',
    signal: 'Signal',
    speed: 'Speed',
    modulation: 'Modulation',
    song: (time) => `A 5 MB song in ${time}`,
    tower: 'Tower',
    gens: 'Generations',
    band: '5G band',
    bands: { low: 'Low · 700 MHz', mid: 'Mid · 3.5 GHz', high: 'mmWave · 28 GHz' },
    aggregation: 'Two 4G bands at once (LTE+)',
    on: 'On air',
    add: 'Add tower',
    remove: 'Remove',
    reset: 'Reset towers',
    walk: 'Walk through town',
    stopWalk: 'Stop',
    lteLabel: 'Phone shows 4G as',
    legend: 'Best network',
    handovers: 'Handovers',
    handover: (from, to) => `${from} → ${to}`,
    none: 'None yet',
    icons: {
      none: 'No tower is close enough',
      G: 'GPRS: 2G data, about 40 kbit/s',
      E: 'EDGE: faster 2G (8PSK), about 200 kbit/s',
      '3G': 'UMTS: plain 3G, about 384 kbit/s',
      H: 'HSPA: faster 3G, up to 14 Mbit/s',
      'H+': 'HSPA+: the fastest 3G, up to 42 Mbit/s',
      '4G': '4G (LTE): tens of Mbit/s',
      LTE: 'LTE: the same as 4G',
      '4G+': 'LTE-Advanced: several 4G bands at once',
      'LTE+': 'LTE-Advanced: several 4G bands at once',
      '5G': '5G on a low or mid band: hundreds of Mbit/s',
      '5G+': '5G on mmWave: over 1 Gbit/s, but only up close',
    },
  },

  guide: {
    sections: { phone: 'The telephone', gens: '1G to 6G', icons: 'Letters on your phone', speeds: 'Speeds', terms: 'Words to know' },
    phone: {
      intro: 'Long before mobiles, a phone was a microphone, an earpiece, a bell and a switch, joined to the exchange by two copper wires.',
      steps: [
        { title: 'The line', text: 'Two copper wires run from your home to the exchange. The exchange keeps 48 V DC on them, which is why a classic phone works even in a power cut.' },
        { title: 'Off the hook', text: 'Lifting the handset closes a switch: about 20–40 mA flows, the exchange notices and plays a dial tone.' },
        { title: 'Dialling', text: 'Rotary dials broke the current into pulses (3 = three clicks). Keypads send two tones per key (DTMF): one from the row, one from the column.' },
        { title: 'Switching', text: 'Operators once joined calls by hand with plugs. Then came mechanical switches, and today digital exchanges carry every call as 64 kbit/s of bits, often over fibre.' },
        { title: 'Ringing', text: 'To ring, the exchange sends 75–90 V AC at 20–25 Hz down the line, enough to swing the bell’s hammer.' },
        { title: 'Talking', text: 'Your voice changes the current; the earpiece at the other end turns those changes back into sound. Both directions share the same two wires.' },
      ],
      keypad: 'DTMF keypad',
      keypadHint: 'Press a key to hear its two tones: its row gives the low tone, its column the high one.',
      tones: { dial: 'Dial tone', busy: 'Busy', ringback: 'Ringing' },
    },
    gens: {
      '1g': {
        name: '1G · analog',
        what: 'The first mobile phones: voice only, sent as FM radio.',
        how: 'Each call got its own frequency (FDMA). Nothing was encrypted: anyone with a scanner could listen in.',
        news: 'The cellular idea itself: many small cells reusing frequencies, and handover between them.',
      },
      '2g': {
        name: '2G · GSM',
        what: 'Digital voice, SMS and the SIM card.',
        how: 'Each 200 kHz channel is cut into 8 time slots (TDMA): eight calls take turns, 0.577 ms each, so fast nobody notices.',
        news: 'Encryption, roaming, SMS. Data came later: GPRS (G) and EDGE (E), which sends 3 bits per symbol with 8PSK.',
      },
      '3g': {
        name: '3G · UMTS',
        what: 'Mobile internet and video calls.',
        how: 'Everyone sends at the same time on the same 5 MHz, each with its own code (CDMA); the receiver picks one code out of the crowd.',
        news: 'HSPA (H) and HSPA+ (H+) added 16- and 64-QAM and made 3G fast enough for apps.',
      },
      '4g': {
        name: '4G · LTE',
        what: 'Everything is internet data, even voice (VoLTE).',
        how: 'The channel is split into hundreds of narrow subcarriers (OFDMA); each user gets blocks of them for a moment. MIMO sends several streams through several antennas.',
        news: 'Up to 256-QAM, carrier aggregation (LTE+ / 4G+), HD voice.',
      },
      '5g': {
        name: '5G · NR',
        what: 'Much faster, far less delay, up to a million devices per km².',
        how: 'Flexible OFDMA, massive MIMO antennas that aim a beam at each phone, and new bands: low (far), mid (3.5 GHz) and mmWave (very fast, very short).',
        news: 'Very low latency for machines and cars, network slicing. Early 5G (NSA) still leans on a 4G anchor; standalone 5G (SA) does not.',
      },
      '6g': {
        name: '6G · coming',
        what: 'Still in research, expected around 2030.',
        how: 'Ideas being tried: terahertz frequencies, AI-run networks, radio that also senses its surroundings, satellites as part of the network.',
        news: 'Goals: up to 1 Tbit/s and less than 0.1 ms of delay.',
      },
    },
    access: {
      FDMA: 'Each user gets a frequency of their own, like lanes on a road.',
      TDMA: 'Users take turns on the same frequency, each in its own time slot.',
      CDMA: 'Everyone talks at once, each in a different code.',
      OFDMA: 'Many narrow subcarriers; each user gets blocks of frequency × time.',
    },
    accessTitle: 'How users share the air',
    labels: {
      year: 'Year',
      standards: 'Standards',
      access: 'Sharing',
      modulation: 'Modulation',
      typical: 'Typical speed',
      peak: 'Top speed',
      latency: 'Delay',
      icons: 'Phone shows',
      future: 'Not here yet',
    },
    icons: [
      { icon: 'G', text: 'GPRS: 2G data, very slow (about 40 kbit/s).' },
      { icon: 'E', text: 'EDGE: faster 2G data thanks to 8PSK (about 200 kbit/s).' },
      { icon: '3G', text: 'UMTS: plain 3G (about 384 kbit/s).' },
      { icon: 'H', text: 'HSPA: faster 3G (up to 14 Mbit/s).' },
      { icon: 'H+', text: 'HSPA+: the fastest 3G (up to 42 Mbit/s).' },
      { icon: '4G / LTE', text: 'The same thing: some phones say 4G, others LTE.' },
      { icon: '4G+ / LTE+', text: 'LTE-Advanced: several 4G channels at once (carrier aggregation).' },
      { icon: '5GE', text: 'A marketing name for LTE-Advanced. It is not 5G.' },
      { icon: '5G', text: '5G on a low or mid band.' },
      { icon: '5G+ · 5G UW', text: '5G on mmWave or a wide mid band: the fastest, shortest range.' },
      { icon: 'VoLTE · HD', text: 'Your calls go over 4G as data, in HD sound.' },
      { icon: 'R', text: 'Roaming: you are on another operator’s network.' },
      { icon: 'SOS', text: 'Only emergency calls: your operator is not in range, but another is.' },
    ],
    speedsHint: 'Typical real download speed of each generation, and how long a 5 MB song takes.',
    song: (time) => `5 MB song: ${time}`,
    terms: [
      { term: 'SIM', text: 'A tiny smart card with your subscriber identity (IMSI) and a secret key; the network uses them to check it is really you.' },
      { term: 'Base station', text: 'The radio equipment of a tower: BTS (2G), NodeB (3G), eNodeB (4G), gNodeB (5G).' },
      { term: 'Cell', text: 'The area one antenna of a tower serves. Many cells side by side make the network: that is why it is called cellular.' },
      { term: 'Handover', text: 'Passing a call from one cell to the next while you move, without dropping it.' },
      { term: 'Backhaul', text: 'The link from a tower to the operator’s network: fibre, or a microwave radio dish.' },
      { term: 'Core network', text: 'The operator’s brain: checks SIMs, knows where phones are, connects calls and the internet.' },
      { term: 'Spectrum', text: 'The radio frequencies an operator is licensed to use, such as 900 MHz or 3.5 GHz.' },
      { term: 'Bandwidth', text: 'How wide a channel is: 200 kHz in GSM, 20 MHz in LTE, up to 100 MHz in 5G. Wider carries more.' },
      { term: 'dBm', text: 'Power on a logarithmic scale: 0 dBm is 1 mW, and every −10 dBm is ten times weaker. Phones still work at about −110 dBm.' },
      { term: 'Latency', text: 'The time for data to go and come back. It matters for calls, games and remote control.' },
      { term: 'Modulation', text: 'Writing bits onto a radio wave by changing its amplitude, frequency or phase.' },
      { term: 'MIMO', text: 'Several antennas on both ends send several streams at once in the same channel.' },
      { term: 'Beamforming', text: 'Many small antennas working together aim the signal at one phone like a torch.' },
      { term: 'Carrier aggregation', text: 'Using several channels at once for one phone: LTE+ / 4G+.' },
      { term: 'VoLTE · VoNR', text: 'Phone calls carried as internet packets over 4G or 5G, with clearer sound.' },
      { term: 'Fibre optics', text: 'Glass threads carrying flashes of light; the light stays inside by total internal reflection.' },
      { term: 'Satellite', text: 'A relay in orbit. Geostationary ones are 36,000 km up (about a quarter of a second each way); low-orbit ones are much closer and faster.' },
    ],
    model: 'Ranges, strengths and speeds here come from a simplified model: they show how things behave, not exact real-world figures.',
  },
}
