import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withDirectives : true
})

// // 请求拦截器
// request.interceptors.request.use(
//   (config) => {
//     // 添加 token
//     const token = localStorage.getItem('token')
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`
//     }
//     return config
//   },
//   (error) => {
//     console.error('请求错误：', error)
//     return Promise.reject(error)
//   }
// )

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 兼容后端不同的字段命名：msg 或 message
    const { code, msg, message, data } = response.data
    const errorMessage = msg || message
    if (code === 200) {
      return data
    }
    // 邮箱未验证
    if (code === 403 && errorMessage && errorMessage.includes('邮箱未验证')) {
      ElMessage.warning('请先完成邮箱验证')
      router.push('/email-verify')
      return Promise.reject(new Error(errorMessage))
    }

    // 未登录或 token 失效
    if (code === 401) {
      ElMessageBox.alert('登录已过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        type: 'warning'
      }).then(() => {
        const authStore = useAuthStore()
        authStore.clearAuth()
        router.push('/login')
      })
      return Promise.reject(new Error(errorMessage || '未授权'))
    }

    // 其他错误
    ElMessage.error(errorMessage || '请求失败')
    return Promise.reject(new Error(errorMessage || '请求失败'))
  },
  (error) => {
    console.error('响应错误：', error)

    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          ElMessage.error('请求参数错误')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error('网络错误，请稍后重试')
      }
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络')
    } else {
      ElMessage.error('网络连接失败')
    }

    return Promise.reject(error)
  }
)

export default request
