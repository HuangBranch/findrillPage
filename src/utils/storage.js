/**
 * localStorage 工具类
 */

// 存储数据
export const setStorage = (key, value) => {
  try {
    const data = JSON.stringify(value)
    localStorage.setItem(key, data)
    return true
  } catch (error) {
    console.error('存储失败：', error)
    return false
  }
}

// 获取数据
export const getStorage = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error('读取失败：', error)
    return defaultValue
  }
}

// 删除数据
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('删除失败：', error)
    return false
  }
}

// 清空所有数据
export const clearStorage = () => {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('清空失败：', error)
    return false
  }
}

/**
 * 答题进度存储
 */

// 保存考试进度
export const saveExamProgress = (userId, examId, progress) => {
  const key = `exam_progress_${userId}_${examId}`
  return setStorage(key, {
    ...progress,
    lastUpdateTime: new Date().toISOString()
  })
}

// 获取考试进度
export const getExamProgress = (userId, examId) => {
  const key = `exam_progress_${userId}_${examId}`
  return getStorage(key)
}

// 清除考试进度
export const clearExamProgress = (userId, examId) => {
  const key = `exam_progress_${userId}_${examId}`
  return removeStorage(key)
}

// 保存刷题进度
export const savePracticeProgress = (userId, sessionId, progress) => {
  const key = `practice_progress_${userId}_${sessionId}`
  return setStorage(key, {
    ...progress,
    lastUpdateTime: new Date().toISOString()
  })
}

// 获取刷题进度
export const getPracticeProgress = (userId, sessionId) => {
  const key = `practice_progress_${userId}_${sessionId}`
  return getStorage(key)
}

// 清除刷题进度
export const clearPracticeProgress = (userId, sessionId) => {
  const key = `practice_progress_${userId}_${sessionId}`
  return removeStorage(key)
}

// 清理过期进度（超过24小时）
export const cleanExpiredProgress = () => {
  const now = new Date().getTime()
  const maxAge = 24 * 60 * 60 * 1000 // 24小时

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('exam_progress_') || key.startsWith('practice_progress_')) {
      try {
        const data = getStorage(key)
        if (data && data.lastUpdateTime) {
          const updateTime = new Date(data.lastUpdateTime).getTime()
          if (now - updateTime > maxAge) {
            removeStorage(key)
          }
        }
      } catch (error) {
        // 如果解析失败，直接删除
        removeStorage(key)
      }
    }
  })
}

export default {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  saveExamProgress,
  getExamProgress,
  clearExamProgress,
  savePracticeProgress,
  getPracticeProgress,
  clearPracticeProgress,
  cleanExpiredProgress
}
