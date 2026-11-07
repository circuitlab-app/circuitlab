import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* Materials and helpers shared by the workshop models. */

export const METAL = { color: '#d4d4d8', metalness: 0.9, roughness: 0.25 } as const
export const GOLD = { color: '#e5c76b', metalness: 0.85, roughness: 0.3 } as const
export const SILK = { color: '#f1f5f9', roughness: 0.7 } as const
/** for big metal faces: without an environment map full metalness looks black */
export const BRUSHED = { color: '#d9dde3', metalness: 0.5, roughness: 0.32 } as const
/** the black epoxy of a chip */
export const CHIP = { color: '#1a1a1c', roughness: 0.45 } as const
/** the copper of coins, strips and coils */
export const COPPER = { color: '#c26a3d', metalness: 0.75, roughness: 0.32 } as const
/** sensor modules lean back a little and turn to show their edge */
export const MODULE_TILT: [number, number, number] = [-0.3, 0.25, 0]

export const unit = (v: number) => THREE.MathUtils.clamp(Number.isFinite(v) ? v : 0, 0, 1)

/** Many small geometries as one, so a grid of bars or traces is a single draw. */
export function merge(parts: THREE.BufferGeometry[]) {
  const merged = mergeGeometries(parts) ?? new THREE.BufferGeometry()
  parts.forEach((g) => g.dispose())
  return merged
}

/** Geometry built once by a module-level `build` and freed when the model goes away. */
export function useBuilt<T extends THREE.BufferGeometry>(build: () => T) {
  const geometry = useMemo(() => build(), [build])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/** Like `useBuilt`, rebuilt whenever `arg` changes. */
export function useBuiltWith<T extends THREE.BufferGeometry, A extends string | number>(build: (arg: A) => T, arg: A) {
  const geometry = useMemo(() => build(arg), [build, arg])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}
