import request from '@/utils/request'

/**
 * ========== 用户管理 ==========
 */

// 获取用户列表
export const getUserList = (params) => {
  return request({ url: '/admin/users/', method: 'GET', params })
}

// 创建用户
export const createUser = (data) => {
  return request({ url: '/admin/users', method: 'POST', data })
}

// 更新用户
export const updateUser = (userId, data) => {
  return request({ url: `/admin/users/${userId}`, method: 'PUT', data })
}

// 删除用户
export const deleteUser = (userId) => {
  return request({ url: `/admin/users/${userId}`, method: 'DELETE' })
}

// 重置用户密码
export const resetUserPassword = (userId, data) => {
  return request({ url: `/admin/users/${userId}/reset-password`, method: 'PATCH', data })
}

/**
 * ========== 课程管理 ==========
 */

// 获取课程列表
export const getAdminCourseList = (params) => {
  return request({ url: '/admin/courses', method: 'GET', params })
}

// 创建课程
export const createCourse = (data) => {
  return request({ url: '/admin/courses', method: 'POST', data })
}

// 更新课程
export const updateCourse = (courseId, data) => {
  return request({ url: `/admin/courses/${courseId}`, method: 'PUT', data })
}

// 删除课程
export const deleteCourse = (courseId) => {
  return request({ url: `/admin/courses/${courseId}`, method: 'DELETE' })
}

/**
 * ========== 章节管理 ==========
 */

// 获取章节列表
export const getAdminChapterList = (params) => {
  return request({ url: '/admin/chapters', method: 'GET', params })
}

// 创建章节
export const createChapter = (data) => {
  return request({ url: '/admin/chapters', method: 'POST', data })
}

// 更新章节
export const updateChapter = (chapterId, data) => {
  return request({ url: `/admin/chapters/${chapterId}`, method: 'PUT', data })
}

// 删除章节
export const deleteChapter = (chapterId) => {
  return request({ url: `/admin/chapters/${chapterId}`, method: 'DELETE' })
}

/**
 * ========== 题目管理 ==========
 */

// 获取题目列表
export const getQuestionList = (params) => {
  return request({ url: '/admin/questions', method: 'GET', params })
}

// 单题目上传
export const createQuestion = (data) => {
  return request({ url: '/admin/questions/single-upload', method: 'POST', data })
}

// 更新题目
export const updateQuestion = (questionId, data) => {
  return request({ url: `/admin/questions/${questionId}`, method: 'PUT', data })
}

// 删除题目
export const deleteQuestion = (questionId) => {
  return request({ url: `/admin/questions/${questionId}`, method: 'DELETE' })
}

// Excel 批量上传
export const batchUploadQuestions = (data) => {
  return request({ url: '/admin/questions/batch-upload', method: 'POST', data })
}

// JSON 数据上传
export const jsonUploadQuestions = (data) => {
  return request({ url: '/admin/questions/json-upload', method: 'POST', data })
}

// 批量删除题目
export const batchDeleteQuestions = (data) => {
  return request({ url: '/admin/questions/batch-delete', method: 'POST', data })
}

/**
 * ========== 记录管理 ==========
 */

// 获取考试/练习记录列表
export const getTraceList = (params) => {
  return request({ url: '/admin/traces', method: 'GET', params })
}

// 获取记录详情
export const getTraceDetail = (traceId) => {
  return request({ url: `/admin/traces/${traceId}`, method: 'GET' })
}

// 删除记录
export const deleteTrace = (traceId) => {
  return request({ url: `/admin/traces/${traceId}`, method: 'DELETE' })
}

/**
 * ========== 统计数据 ==========
 */

// 获取后台统计数据
export const getAdminStats = () => {
  return request({ url: '/admin/stats', method: 'GET' })
}

export default {
  // 用户管理
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  // 课程管理
  getAdminCourseList,
  createCourse,
  updateCourse,
  deleteCourse,
  // 章节管理
  getAdminChapterList,
  createChapter,
  updateChapter,
  deleteChapter,
  // 题目管理
  getQuestionList,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  batchUploadQuestions,
  jsonUploadQuestions,
  batchDeleteQuestions,
  // 记录管理
  getTraceList,
  getTraceDetail,
  deleteTrace,
  // 统计
  getAdminStats
}
