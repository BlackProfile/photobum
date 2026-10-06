import { getSupabase } from './supabaseClient'

const DB_NAME = 'DazzEventDB'
const STORE_NAME = 'photos'
const DB_VERSION = 1

// Web BroadcastChannel safe check for iOS Safari
function getSyncChannel() {
  if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
    try {
      return new BroadcastChannel('dazzevent_sync')
    } catch (e) {
      return null
    }
  }
  return null
}

const syncChannel = getSyncChannel()

/**
 * Open IndexedDB helper (safe on iOS Safari Private Browsing)
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
      return resolve(null)
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('event_id', 'event_id', { unique: false })
          store.createIndex('created_at', 'created_at', { unique: false })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch (err) {
      resolve(null)
    }
  })
}

// Default event metadata
export const DEFAULT_EVENT = {
  id: 'celebration-2026',
  title: 'Sarah & Rian Wedding Celebration',
  date: '2026-10-06',
  venue: 'Glasshouse Botanical Garden',
  host_name: 'Sarah & Rian',
  welcome_msg: 'Terima kasih telah hadir! Abadikan momen indah ini bersama kami menggunakan kamera Dazz Cam.',
  cover_url: '/samples/sample_wedding.jpg',
}

// Initial demo photos to wow the user immediately
export const INITIAL_DEMO_PHOTOS = [
  {
    id: 'demo-1',
    event_id: 'celebration-2026',
    guest_name: 'Adit & Dimas',
    guest_note: 'Happy wedding Sarah & Rian! Semoga langgeng dan bahagia selalu selamanya 🎉✨',
    photo_url: '/samples/sample_wedding.jpg',
    preset_id: 'cpm35',
    likes: 18,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'demo-2',
    event_id: 'celebration-2026',
    guest_name: 'Nadia & Geng Kampus',
    guest_note: 'Foto candid seru bareng the birthday squad! The best party of the year 🥂🎂',
    photo_url: '/samples/sample_party.jpg',
    preset_id: 'dispo',
    likes: 24,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'demo-3',
    event_id: 'celebration-2026',
    guest_name: 'Kevin Pratama',
    guest_note: 'Momen berkesan di acara malam ini. Tone monochrome GR D nya estetik banget! 🖤',
    photo_url: '/samples/sample_grd.jpg',
    preset_id: 'gr_d',
    likes: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
]

/**
 * Get Event Details (from LocalStorage or Supabase)
 */
export async function getEventDetails(eventId = 'celebration-2026') {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (data && !error) return data
    } catch (err) {
      console.warn('Supabase getEvent error:', err)
    }
  }

  // Local storage fallback
  const stored = localStorage.getItem(`dazzevent_event_${eventId}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      // ignore
    }
  }
  return { ...DEFAULT_EVENT, id: eventId }
}

const EVENTS_INDEX_KEY = 'dazzevent_all_event_ids'

/**
 * Get all events registered on host
 */
export async function getAllEvents() {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
      if (data && !error && data.length > 0) return data
    } catch (err) {
      console.warn('Supabase getAllEvents error:', err)
    }
  }

  // Local storage lookup
  let eventIds = []
  try {
    const raw = localStorage.getItem(EVENTS_INDEX_KEY)
    if (raw) eventIds = JSON.parse(raw)
  } catch (e) {}

  if (!eventIds.includes('celebration-2026')) {
    eventIds.unshift('celebration-2026')
  }

  const events = []
  for (const id of eventIds) {
    const ev = await getEventDetails(id)
    if (ev) events.push(ev)
  }
  return events
}

/**
 * Register a new event ID
 */
export function registerEventId(eventId) {
  try {
    let eventIds = []
    const raw = localStorage.getItem(EVENTS_INDEX_KEY)
    if (raw) eventIds = JSON.parse(raw)
    if (!eventIds.includes(eventId)) {
      eventIds.push(eventId)
      localStorage.setItem(EVENTS_INDEX_KEY, JSON.stringify(eventIds))
    }
  } catch (e) {}
}

/**
 * Delete an entire event
 */
export async function deleteEvent(eventId) {
  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('events').delete().eq('id', eventId)
      await supabase.from('photos').delete().eq('event_id', eventId)
    } catch (e) {}
  }

  localStorage.removeItem(`dazzevent_event_${eventId}`)
  try {
    const raw = localStorage.getItem(EVENTS_INDEX_KEY)
    if (raw) {
      const filtered = JSON.parse(raw).filter((id) => id !== eventId)
      localStorage.setItem(EVENTS_INDEX_KEY, JSON.stringify(filtered))
    }
  } catch (e) {}
}

/**
 * Save / Update Event Details
 */
export async function saveEventDetails(eventData) {
  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('events').upsert(eventData)
    } catch (err) {
      console.warn('Supabase upsert event error:', err)
    }
  }

  registerEventId(eventData.id)
  localStorage.setItem(`dazzevent_event_${eventData.id}`, JSON.stringify(eventData))
  syncChannel?.postMessage({ type: 'EVENT_UPDATED', payload: eventData })
  return eventData
}

/**
 * Get all photos for an event
 */
export async function getPhotos(eventId = 'celebration-2026') {
  const supabase = getSupabase()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      if (data && !error && data.length > 0) {
        return data
      }
    } catch (err) {
      console.warn('Supabase getPhotos error:', err)
    }
  }

  // IndexedDB retrieval
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    return new Promise((resolve) => {
      request.onsuccess = () => {
        let results = request.result || []
        results = results.filter((p) => p.event_id === eventId)

        // Return empty array instead of re-injecting demo photos
        if (results.length === 0) {
          const hasBeenCleaned = localStorage.getItem(`dazzevent_cleaned_${eventId}`) === 'true'
          if (!hasBeenCleaned && eventId === 'celebration-2026') {
            seedInitialPhotos(eventId).then((seeded) => resolve(seeded))
          } else {
            resolve([])
          }
        } else {
          // Sort newest first
          results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          resolve(results)
        }
      }
      request.onerror = () => resolve([])
    })
  } catch (err) {
    console.warn('IndexedDB error, using fallback:', err)
    return []
  }
}

/**
 * Pre-populate initial sample photos in IndexedDB
 */
async function seedInitialPhotos(eventId) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const photo of INITIAL_DEMO_PHOTOS) {
      store.put({ ...photo, event_id: eventId })
    }
    await new Promise((res) => {
      tx.oncomplete = res
    })
    return INITIAL_DEMO_PHOTOS
  } catch (e) {
    return INITIAL_DEMO_PHOTOS
  }
}

/**
 * Save new photo taken by guest
 */
export async function savePhoto(photoItem) {
  const newPhoto = {
    id: photoItem.id || 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    event_id: photoItem.event_id || 'celebration-2026',
    guest_name: photoItem.guest_name || 'Tamu Istimewa',
    guest_note: photoItem.guest_note || '',
    photo_url: photoItem.photo_url,
    preset_id: photoItem.preset_id || 'cpm35',
    likes: 0,
    created_at: new Date().toISOString(),
  }

  // 1. Try Supabase cloud upload
  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('photos').insert(newPhoto)
    } catch (err) {
      console.warn('Supabase savePhoto error:', err)
    }
  }

  // 2. Always persist locally in IndexedDB for reliability
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(newPhoto)
  } catch (err) {
    console.warn('IndexedDB put error:', err)
  }

  // 3. Broadcast to all open tabs/windows
  syncChannel?.postMessage({ type: 'PHOTO_ADDED', payload: newPhoto })

  return newPhoto
}

/**
 * Like / Unlike a photo
 */
export async function toggleLikePhoto(photoId, currentLikes = 0) {
  const likedStorageKey = `dazzevent_liked_${photoId}`
  const isCurrentlyLiked = localStorage.getItem(likedStorageKey) === 'true'
  const newLikes = isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1

  if (isCurrentlyLiked) {
    localStorage.removeItem(likedStorageKey)
  } else {
    localStorage.setItem(likedStorageKey, 'true')
  }

  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('photos').update({ likes: newLikes }).eq('id', photoId)
    } catch (err) {
      console.warn('Supabase like error:', err)
    }
  }

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(photoId)
    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = { ...getReq.result, likes: newLikes }
        store.put(updated)
      }
    }
  } catch (err) {
    // ignore
  }

  syncChannel?.postMessage({
    type: 'PHOTO_LIKED',
    payload: { id: photoId, likes: newLikes },
  })

  return { isLiked: !isCurrentlyLiked, likes: newLikes }
}

export function isPhotoLiked(photoId) {
  return localStorage.getItem(`dazzevent_liked_${photoId}`) === 'true'
}

/**
 * Delete photo (for Host)
 */
export async function deletePhoto(photoId) {
  const supabase = getSupabase()
  if (supabase) {
    try {
      await supabase.from('photos').delete().eq('id', photoId)
    } catch (err) {
      console.warn('Supabase delete error:', err)
    }
  }

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(photoId)
  } catch (err) {
    // ignore
  }

  syncChannel?.postMessage({ type: 'PHOTO_DELETED', payload: { id: photoId } })
  return true
}

/**
 * Listen for realtime updates (Supabase Realtime + BroadcastChannel)
 */
export function subscribeToPhotos(eventId, onUpdate) {
  const supabase = getSupabase()
  let supabaseChannel = null

  if (supabase) {
    try {
      supabaseChannel = supabase
        .channel(`public:photos:${eventId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'photos', filter: `event_id=eq.${eventId}` },
          (payload) => {
            onUpdate({ source: 'supabase', change: payload })
          }
        )
        .subscribe()
    } catch (e) {
      console.warn('Supabase subscribe error:', e)
    }
  }

  // Cross-tab broadcast listener
  const handleBroadcast = (event) => {
    if (event.data) {
      onUpdate({ source: 'broadcast', data: event.data })
    }
  }

  syncChannel?.addEventListener('message', handleBroadcast)

  // Unsubscribe cleanup
  return () => {
    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel)
    }
    syncChannel?.removeEventListener('message', handleBroadcast)
  }
}
