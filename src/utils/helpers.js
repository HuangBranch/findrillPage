/**
 * 通用辅助函数
 */

/**
 * 格式化时间
 * @param {String|Date} time - 时间
 * @param {String} format - 格式
 * @returns {String} 格式化后的时间
 */
export const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!time) return ''
  const date = new Date(time)
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 格式化秒数为时分秒
 * @param {Number} seconds - 秒数
 * @returns {String} 格式化后的时间
 */
export const formatSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * 脱敏邮箱
 * @param {String} email - 邮箱地址
 * @returns {String} 脱敏后的邮箱
 */
export const maskEmail = (email) => {
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!username || !domain) return email

  const visibleLength = Math.min(3, Math.floor(username.length / 2))
  const maskedUsername = username.slice(0, visibleLength) + '***'
  return `${maskedUsername}@${domain}`
}

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {Number} delay - 延迟时间
 * @returns {Function} 防抖后的函数
 */
export const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {Number} delay - 延迟时间
 * @returns {Function} 节流后的函数
 */
export const throttle = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 生成唯一ID
 * @returns {String} 唯一ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 深拷贝
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map((item) => deepClone(item))

  const cloneObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key])
    }
  }
  return cloneObj
}

/**
 * 题型映射
 */
export const questionTypeMap = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题'
}

/**
 * 获取题型名称
 * @param {String} type - 题型代码
 * @returns {String} 题型名称
 */
export const getQuestionTypeName = (type) => {
  return questionTypeMap[type] || '未知'
}

/**
 * 难度映射
 */
export const difficultyMap = {
  1: '非常简单',
  2: '简单',
  3: '中等',
  4: '困难',
  5: '非常困难'
}

/**
 * 获取难度名称
 * @param {Number} difficulty - 难度值
 * @returns {String} 难度名称
 */
export const getDifficultyName = (difficulty) => {
  return difficultyMap[difficulty] || '中等'
}

/**
 * 计算分数
 * @param {Number} rightCount - 答对题数
 * @param {Number} totalCount - 总题数
 * @returns {Number} 分数（满分100）
 */
export const calculateScore = (rightCount, totalCount) => {
  if (totalCount === 0) return 0
  return Math.round((rightCount / totalCount) * 100)
}

/**
 * 判断答案是否正确
 * @param {Array} userAnswer - 用户答案
 * @param {Array} correctAnswer - 正确答案
 * @returns {Boolean} 是否正确
 */
export const checkAnswer = (userAnswer, correctAnswer) => {
  if (!userAnswer || !correctAnswer) return false
  if (userAnswer.length !== correctAnswer.length) return false

  const sortedUser = [...userAnswer].sort()
  const sortedCorrect = [...correctAnswer].sort()

  return sortedUser.every((ans, index) => ans === sortedCorrect[index])
}

export default {
  formatTime,
  formatSeconds,
  maskEmail,
  debounce,
  throttle,
  generateId,
  deepClone,
  getQuestionTypeName,
  getDifficultyName,
  calculateScore,
  checkAnswer
}
