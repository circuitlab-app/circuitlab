import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react'
import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { PARTS } from '@/circuit/catalog'
import type { PartNode as PartNodeType, WireEdge as WireEdgeType } from '@/circuit/types'
import { playPlace } from '@/lib/sound'
import { useCircuit } from '@/store/circuit'
import { useSettings } from '@/store/settings'

// the shared 3D canvas comes with three.js, so it loads after the first paint
const SceneCanvas = lazy(() => import('@/three/SceneCanvas'))
import { CanvasControls, DropZone, EmptyState, ShortCircuitAlert, WirePalette } from './CanvasOverlays'
import { PartNode } from './PartNode'
import { BoardStatusPill } from './StatusBar'
import { ConnectionLine, WireEdge } from './WireEdge'

const nodeTypes = { part: PartNode }
const edgeTypes = { wire: WireEdge }

/** A wire must join two different parts. */
const isValidConnection = (c: Connection | Edge) => c.source !== c.target

/** Fits the view after a preset is loaded, once React Flow has measured the new parts. */
function FitOnLoad() {
  const request = useCircuit((s) => s.fitRequest)
  // React Flow reports a node's size back through onNodesChange, so a freshly
  // loaded board is ready once every one of its nodes carries `measured`.
  const measured = useCircuit((s) => s.nodes.length > 0 && s.nodes.every((n) => n.measured?.width))
  const { fitView } = useReactFlow()
  const handled = useRef(request)
  useEffect(() => {
    if (!measured || handled.current === request) return
    handled.current = request
    void fitView({ duration: 600, padding: 0.2, maxZoom: 1 })
  }, [request, measured, fitView])
  return null
}

export function Workspace() {
  const nodes = useCircuit((s) => s.nodes)
  const edges = useCircuit((s) => s.edges)
  const onNodesChange = useCircuit((s) => s.onNodesChange)
  const onEdgesChange = useCircuit((s) => s.onEdgesChange)
  const connect = useCircuit((s) => s.onConnect)
  const checkpoint = useCircuit((s) => s.checkpoint)
  const theme = useSettings((s) => s.theme)

  const onConnect = useCallback(
    (connection: Connection) => {
      const before = useCircuit.getState().edges.length
      connect(connection)
      if (useCircuit.getState().edges.length > before) playPlace()
    },
    [connect],
  )

  const onBeforeDelete = useCallback(async () => {
    checkpoint()
    return true
  }, [checkpoint])

  return (
    <div className="board absolute inset-0" data-board>
      <ReactFlow<PartNodeType, WireEdgeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onBeforeDelete={onBeforeDelete}
        onNodeDragStart={checkpoint}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={ConnectionLine}
        connectionRadius={36}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[12, 12]}
        // low enough that "fit" shows a whole wide example on a 390 px phone
        minZoom={0.15}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
        colorMode={theme}
        defaultEdgeOptions={{ type: 'wire' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.6} className="board__grid" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          className="float-panel !m-3 overflow-hidden rounded-xl max-lg:!hidden"
          nodeBorderRadius={14}
          style={{ width: 168, height: 112 }}
          nodeColor={(n) => `color-mix(in oklch, ${PARTS[(n as PartNodeType).data.type].accent} 70%, transparent)`}
          maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
        />
        <WirePalette />
        <CanvasControls />
        <FitOnLoad />
        <Suspense fallback={null}>
          <SceneCanvas />
        </Suspense>
        <EmptyState />
        <DropZone />
        <ShortCircuitAlert />
        <BoardStatusPill />
      </ReactFlow>
    </div>
  )
}
