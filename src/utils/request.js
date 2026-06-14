import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { getStorage, removeStorage } from '@/utils/storage'

let loginDialogVisible = false
const AUTH_USER_KEY = 'auth:user'
const AUTH_TOKEN_KEY = 'auth:token'

const resolveApiBaseURL = () => {
  const configured = import.meta.env.VITE_API_BASE_URL || '/api'
  if (typeof window === 'undefined' || !configured.startsWith('http')) {
    return configured
  }

  try {
    const url = new URL(configured)
    const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    const isLocalApi = ['localhost', '127.0.0.1'].includes(url.hostname)
    if (isLocalPage && isLocalApi && window.location.hostname !== url.hostname) {
      url.hostname = window.location.hostname
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    return configured
  }

  return configured
}

const readCookie = (name) => {
  if (typeof document === 'undefined') return ''
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') || ''
}

const readAuthToken = () => getStorage(AUTH_TOKEN_KEY, '') || readCookie('token')

const request = axios.create({
  baseURL: resolveApiBaseURL(),
  timeout: 20000,
  withCredentials: true
})

request.interceptors.request.use((config) => {
  const token = readAuthToken()
  if (token && !config.headers?.token) {
    config.headers = config.headers || {}
    config.headers.token = decodeURIComponent(token)
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const contentType = response.headers?.['content-type'] || ''
    if (response.config.responseType === 'blob' || contentType.includes('application/octet-stream')) {
      return response.data
    }

    const payload = response.data
    if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, 'code')) {
      return payload
    }

    const { code, msg, message, data } = payload
    if (code === 200) {
      return data
    }

    const errorMessage = msg || message || '请求失败'
    if (code === 401) {
      if (!loginDialogVisible) {
        loginDialogVisible = true
        ElMessageBox.alert('登录已失效，请重新登录。', '需要登录', {
          confirmButtonText: '去登录',
          type: 'warning'
        }).finally(() => {
          loginDialogVisible = false
          removeStorage(AUTH_USER_KEY)
          removeStorage(AUTH_TOKEN_KEY)
          router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
        })
      }
      return Promise.reject(new Error(errorMessage))
    }

    if (!response.config.silent) {
      if (code === 403) {
        ElMessage.warning(errorMessage || '当前账号没有权限访问该资源')
      } else {
        ElMessage.error(errorMessage)
      }
    }
    return Promise.reject(new Error(errorMessage))
  },
  (error) => {
    const silent = error.config?.silent
    if (!silent) {
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请检查后端服务是否正常。')
      } else if (error.response?.status === 401) {
        ElMessage.warning('请先登录')
      } else if (error.response?.status === 403) {
        ElMessage.warning('当前账号没有权限访问该资源')
      } else if (error.response?.status >= 500) {
        ElMessage.error('服务器异常，请稍后再试。')
      } else {
        ElMessage.error(error.message || '网络连接失败')
      }
    }
    return Promise.reject(error)
  }
)

export default request
