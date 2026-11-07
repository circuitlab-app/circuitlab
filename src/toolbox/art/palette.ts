/*
 * The colours and small helpers every tool drawing shares (no JSX, so the
 * drawing files can export only components).
 */

export type ArtProps = { id: string }
/** a colour, or [offset, colour] or [offset, colour, opacity] */
export type Stop = string | [number, string] | [number, string, number]
export const r2 = (n: number) => Math.round(n * 100) / 100
export const url = (id: string) => `url(#${id})`
export const STEEL: Stop[] = ['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a']
export const STEEL_ROUND: Stop[] = ['#71717a', '#e4e4e7', '#a1a1aa', '#52525b']
export const LCD: Stop[] = ['#e3ebd5', '#b9c8a2']
export const COPPER: Stop[] = ['#fcd34d', '#d97706', '#92400e']
export const SEGMENTS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']
