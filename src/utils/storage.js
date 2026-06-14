/**
 * storage.js — localStorage helpers for bookmarks and user settings.
 * All reads are wrapped in try/catch so corrupt data never crashes the UI.
 */

const KEYS = {
  bookmarks: 'luxewood_bookmarks',
  settings:  'luxewood_settings',
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/** @returns {string[]} */
export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.bookmarks) ?? '[]')
  } catch {
    return []
  }
}

/** @param {string} id */
export function addBookmark(id) {
  const list = getBookmarks()
  if (!list.includes(id)) {
    list.push(id)
    localStorage.setItem(KEYS.bookmarks, JSON.stringify(list))
  }
}

/** @param {string} id */
export function removeBookmark(id) {
  const list = getBookmarks().filter((b) => b !== id)
  localStorage.setItem(KEYS.bookmarks, JSON.stringify(list))
}

/** @param {string} id @returns {boolean} */
export function isBookmarked(id) {
  return getBookmarks().includes(id)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/** @returns {Record<string, unknown>} */
export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings) ?? '{}')
  } catch {
    return {}
  }
}

/** @param {Record<string, unknown>} patch */
export function saveSettings(patch) {
  localStorage.setItem(KEYS.settings, JSON.stringify({ ...getSettings(), ...patch }))
}
