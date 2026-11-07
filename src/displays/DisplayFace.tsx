import type { PartResult } from '@/circuit/solver'
import type { PartData } from '@/circuit/types'
import { LcdFace } from './LcdFace'
import { LedFace } from './LedFace'
import { OledFace } from './OledFace'
import { SegmentFace } from './SegmentFace'
import { TftFace } from './TftFace'

/**
 * The front of a screen, drawn in the card's window instead of a 3D model.
 * Its own module, loaded only once a screen is on the board.
 */
export default function DisplayFace({ data, result }: { data: PartData; result?: PartResult }) {
  // a screen works from about 3 V; below that (or the wrong way round) it stays dark
  const powered = result?.status === 'on'
  // screens with an S input report its voltage as their level
  const volts = powered ? (result?.level ?? 0) : 0
  switch (data.type) {
    case 'segment':
      return <SegmentFace data={data} powered={powered} volts={volts} />
    case 'lcd':
      return <LcdFace data={data} powered={powered} />
    case 'oled':
      return <OledFace data={data} powered={powered} volts={volts} />
    case 'tft':
      return <TftFace data={data} powered={powered} />
    case 'matrix':
    case 'ledwall':
      return <LedFace data={data} powered={powered} />
    default:
      return null
  }
}
