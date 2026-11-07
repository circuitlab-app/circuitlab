import { View } from '@react-three/drei'
import type { PartResult } from '@/circuit/solver'
import type { PartData } from '@/circuit/types'
import { PartScene } from './PartScene'
import { VIEW_PRIORITY } from './SceneCanvas'

/**
 * The 3D window of one part card. It lives in its own module so the whole
 * three.js bundle loads after the app has painted, not before.
 */
export default function PartView({ data, result, thinking }: { data: PartData; result?: PartResult; thinking?: boolean }) {
  return (
    <View index={VIEW_PRIORITY} className="absolute inset-0">
      <PartScene data={data} result={result} thinking={thinking} />
    </View>
  )
}
