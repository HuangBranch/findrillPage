export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Failed to write localStorage:', error)
    return false
  }
}

export const getStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (error) {
    console.error('Failed to read localStorage:', error)
    return defaultValue
  }
}

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Failed to remove localStorage:', error)
    return false
  }
}

export const clearStorage = () => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
    return false
  }
}

const progressKey = (type, userId, id) => `${type}_progress_${userId}_${id}`

export const savePracticeProgress = (userId, sessionId, progress) =>
  setStorage(progressKey('practice', userId, sessionId), { ...progress, lastUpdateTime: new Date().toISOString() })

export const getPracticeProgress = (userId, sessionId) => getStorage(progressKey('practice', userId, sessionId))

export const clearPracticeProgress = (userId, sessionId) => removeStorage(progressKey('practice', userId, sessionId))

export const cleanExpiredProgress = () => {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000
  Object.keys(localStorage).forEach((key) => {
    if (!key.startsWith('practice_progress_')) return
    const value = getStorage(key)
    const updatedAt = value?.lastUpdateTime ? new Date(value.lastUpdateTime).getTime() : 0
    if (!updatedAt || now - updatedAt > maxAge) {
      removeStorage(key)
    }
  })
}

export default {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  savePracticeProgress,
  getPracticeProgress,
  clearPracticeProgress,
  cleanExpiredProgress
}
