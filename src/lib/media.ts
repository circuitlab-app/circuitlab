import type { MediaRef } from '@/circuit/types'

/*
 * Photos and videos shown on the screens. Files are far too big for the
 * board's localStorage save, so each one is kept in IndexedDB and the part
 * only remembers its id, name and kind. Undo, copy and reload keep working
 * because the file stays in the database while anything may still point at it.
 */

const DB_NAME = 'circuit-lab-media'
const STORE = 'files'

/** Bigger files are refused: they would fill the device for one screen. */
export const MAX_MEDIA_BYTES = 200 * 1024 * 1024

type StoredMedia = { id: string; blob: Blob; name: string; added: number }

let database: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  }).catch((error: unknown) => {
    // let a later call try again (private windows can refuse at first)
    database = null
    throw error
  })
  return database
}

function promised<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function store(mode: IDBTransactionMode) {
  return (await open()).transaction(STORE, mode).objectStore(STORE)
}

export function mediaKind(file: Blob): MediaRef['kind'] | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

/** Keeps a file and returns what a part needs to find it again. */
export async function saveMedia(file: File): Promise<MediaRef> {
  const kind = mediaKind(file)
  if (!kind) throw new Error('not a photo or video')
  const id = `media-${crypto.randomUUID()}`
  const entry: StoredMedia = { id, blob: file, name: file.name, added: Date.now() }
  await promised((await store('readwrite')).put(entry))
  return { id, name: file.name, kind }
}

/** Several screens may show the same file: read it from the database once. */
const cache = new Map<string, Promise<Blob | null>>()

export function loadMedia(id: string): Promise<Blob | null> {
  let pending = cache.get(id)
  if (!pending) {
    pending = store('readonly')
      .then((s) => promised(s.get(id) as IDBRequest<StoredMedia | undefined>))
      .then((entry) => entry?.blob ?? null)
      .catch(() => null)
    cache.set(id, pending)
    // a missing file may still arrive (another tab): ask again next time
    void pending.then((blob) => blob || cache.delete(id))
  }
  return pending
}

/**
 * Removes files nothing points at any more. Files added in the last day are
 * kept, so a board open in another tab never loses its pictures.
 */
export async function pruneMedia(keep: ReadonlySet<string>, minAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const entries = await promised((await store('readonly')).getAll() as IDBRequest<StoredMedia[]>)
    const now = Date.now()
    const stale = entries.filter((e) => !keep.has(e.id) && now - e.added >= minAgeMs)
    if (stale.length === 0) return
    const s = await store('readwrite')
    for (const entry of stale) {
      s.delete(entry.id)
      cache.delete(entry.id)
    }
  } catch {
    // tidying up is optional
  }
}
