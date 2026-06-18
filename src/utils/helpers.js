import dayjs from 'dayjs'

export const safeJsonParse = (value, fallback = []) => {
  if (value === null || value === undefined || value === '') return fallback
  if (Array.isArray(value) || typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const parseOptions = (optionsJson) => {
  const options = safeJsonParse(optionsJson, [])
  if (!Array.isArray(options)) return []
  return options
    .map((item, index) => ({
      optionKey: item.optionKey ?? item.key ?? String.fromCharCode(65 + index),
      optionType: item.optionType ?? 1,
      contentHtml: item.contentHtml ?? item.content ?? item.label ?? '',
      sort: item.sort ?? index
    }))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

export const parseAnswerArray = (value) => {
  const parsed = safeJsonParse(value, [])
  const normalizeItem = (item) => {
    if (item && typeof item === 'object') {
      return item.answerValue ?? item.value ?? item.optionKey ?? item.content ?? ''
    }
    return item === null || item === undefined ? '' : String(item)
  }
  if (Array.isArray(parsed)) return parsed.map(normalizeItem).filter((item) => item !== '')
  if (parsed === null || parsed === undefined || parsed === '') return []
  return [normalizeItem(parsed)].filter((item) => item !== '')
}

export const stripHtml = (html = '') => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export const formatDateTime = (value) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-')

export const formatDuration = (seconds) => {
  const value = Number(seconds || 0)
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60
  if (h > 0) return `${h}小时${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

export const percentText = (value) => {
  if (value === null || value === undefined || value === '') return '0%'
  const num = Number(value)
  if (Number.isNaN(num)) return '0%'
  return `${Math.round(num * 100)}%`
}

export const getPageList = (pageData) => {
  if (Array.isArray(pageData)) return pageData
  return pageData?.list || pageData?.records || []
}

export const getPageTotal = (pageData) => Number(pageData?.total || 0)

export const normalizeBoolean = (value) => value === true || value === 1 || value === '1'

export const clone = (value) => JSON.parse(JSON.stringify(value))

export const generateId = () => `${Date.now()}${Math.random().toString(16).slice(2)}`
