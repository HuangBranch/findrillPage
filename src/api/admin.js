import request from '@/utils/request'

const get = (url, params, config = {}) => request({ url, method: 'GET', params, ...config })
const post = (url, data, config = {}) => request({ url, method: 'POST', data, ...config })
const put = (url, data, config = {}) => request({ url, method: 'PUT', data, ...config })
const patch = (url, data, config = {}) => request({ url, method: 'PATCH', data, ...config })
const del = (url, config = {}) => request({ url, method: 'DELETE', ...config })

export const listUsers = (params) => get('/admin/users/list', params)
export const getUser = (id) => get(`/admin/users/${id}`)
export const createUser = (data) => post('/admin/users', data)
export const updateUser = (id, data) => put(`/admin/users/${id}`, data)
export const resetUserPassword = (id, data) => patch(`/admin/users/${id}/reset-password`, data)
export const updateUserStatus = (id, data) => patch(`/admin/users/${id}/status`, data)
export const assignUserRole = (id, data) => put(`/admin/users/${id}/role`, data)
export const deleteUser = (id) => del(`/admin/users/${id}`)

export const listRoles = (params) => get('/admin/roles/list', params)
export const getRoleDetail = (id) => get(`/admin/roles/${id}`)
export const createRole = (data) => post('/admin/roles', data)
export const updateRole = (id, data) => put(`/admin/roles/${id}`, data)
export const assignRolePermissions = (id, data) => put(`/admin/roles/${id}/permissions`, data)
export const listPermissions = () => get('/admin/permissions/list')
export const listAdminMenu = (config = {}) => get('/admin/permissions/menu', undefined, config)

export const listCourses = (params, config = {}) => get('/admin/courses/list', params, config)
export const getCourse = (id) => get(`/admin/courses/${id}`)
export const createCourse = (data) => post('/admin/courses', data)
export const updateCourse = (id, data) => put(`/admin/courses/${id}`, data)
export const updateCourseStatus = (id, enabled) => put(`/admin/courses/${id}/status`, { enabled })
export const deleteCourse = (id) => del(`/admin/courses/${id}`)

export const listChapters = (params, config = {}) => get('/admin/chapters/list', params, config)
export const getChapter = (id) => get(`/admin/chapters/${id}`)
export const createChapter = (data) => post('/admin/chapters', data)
export const updateChapter = (id, data) => put(`/admin/chapters/${id}`, data)
export const updateChapterStatus = (id, enabled) => put(`/admin/chapters/${id}/status`, { enabled })
export const sortChapters = (data) => put('/admin/chapters/sort', data)
export const deleteChapter = (id) => del(`/admin/chapters/${id}`)

export const listKnowledgeTree = (params = {}) => get('/admin/knowledge-points/tree', params)
export const getKnowledgePoint = (id) => get(`/admin/knowledge-points/${id}`)
export const createKnowledgePoint = (data) => post('/admin/knowledge-points', data)
export const updateKnowledgePoint = (id, data) => put(`/admin/knowledge-points/${id}`, data)
export const updateKnowledgePointStatus = (id, enabled) => put(`/admin/knowledge-points/${id}/status`, { enabled })
export const deleteKnowledgePoint = (id) => del(`/admin/knowledge-points/${id}`)

export const listQuestions = (params) => get('/admin/questions/list', params)
export const getQuestionDetail = (id) => get(`/admin/questions/${id}`)
export const createQuestion = (data) => post('/admin/questions', data)
export const updateQuestion = (id, data) => put(`/admin/questions/${id}`, data)
export const deleteQuestion = (id) => del(`/admin/questions/${id}`)
export const bindQuestionKnowledge = (id, data) => put(`/admin/questions/${id}/knowledge-points`, data)
export const submitQuestionAudit = (id, data = {}) => post(`/admin/questions/${id}/submit`, data)
export const publishQuestion = (id, data = {}) => post(`/admin/questions/${id}/publish`, data)
export const disableQuestion = (id, data = {}) => put(`/admin/questions/${id}/disable`, data)
export const listQuestionVersions = (id) => get(`/admin/questions/${id}/versions`)
export const listQuestionAuditLogs = (id) => get(`/admin/questions/${id}/audit-logs`)

export const getImportTemplate = () => get('/admin/question-imports/template')
export const importQuestions = (data) => post('/admin/question-imports', data)
export const importQuestionExcel = (file) => {
  const data = new FormData()
  data.append('file', file)
  return post('/admin/question-imports/excel', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const listImportBatches = (params) => get('/admin/question-imports/list', params)
export const getImportBatch = (id) => get(`/admin/question-imports/${id}`)
export const listImportErrors = (id) => get(`/admin/question-imports/${id}/errors`)

export const listAuditQuestions = (params) => get('/admin/question-audits/list', params)
export const approveQuestion = (id, data = {}) => post(`/admin/question-audits/${id}/approve`, data)
export const rejectQuestion = (id, data = {}) => post(`/admin/question-audits/${id}/reject`, data)

export const listQuestionReports = (params) => get('/admin/question-reports/list', params)
export const handleQuestionReport = (id, data) => put(`/admin/question-reports/${id}/handle`, data)

export const listExamConfigsAdmin = (params) => get('/admin/exam-configs/list', params)
export const getExamConfig = (id) => get(`/admin/exam-configs/${id}`)
export const createExamConfig = (data) => post('/admin/exam-configs', data)
export const updateExamConfig = (id, data) => put(`/admin/exam-configs/${id}`, data)
export const updateExamConfigStatus = (id, enabled) => put(`/admin/exam-configs/${id}/status`, { enabled })
export const deleteExamConfig = (id) => del(`/admin/exam-configs/${id}`)

export const listPendingGradings = () => get('/admin/gradings/pending')
export const gradeAnswer = (answerId, data) => post(`/admin/gradings/${answerId}`, data)

export const getOverviewStats = () => get('/admin/statistics/overview')
export const getQuestionErrorStats = () => get('/admin/statistics/question-errors')
export const getChapterMasteryStats = () => get('/admin/statistics/chapter-mastery')

export const getSystemInitStatus = () => get('/admin/system/init/status')
export const initSystem = (data) => post('/admin/system/init', data)

export const uploadMediaAsset = (file, ownerType, ownerId) => {
  const data = new FormData()
  data.append('file', file)
  return post('/admin/media-assets/upload', data, {
    params: { ownerType, ownerId },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const createMediaAsset = (data) => post('/admin/media-assets', data)
export const listMediaAssets = (params) => get('/admin/media-assets/list', params)
export const bindMediaAsset = (id, data) => put(`/admin/media-assets/${id}/owner`, data)
export const deleteMediaAsset = (id) => del(`/admin/media-assets/${id}`)

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetUserPassword,
  updateUserStatus,
  assignUserRole,
  deleteUser,
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  assignRolePermissions,
  listPermissions,
  listAdminMenu,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  listChapters,
  getChapter,
  createChapter,
  updateChapter,
  updateChapterStatus,
  sortChapters,
  deleteChapter,
  listKnowledgeTree,
  listQuestions,
  getQuestionDetail,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitQuestionAudit,
  publishQuestion,
  disableQuestion,
  listExamConfigsAdmin,
  createExamConfig,
  updateExamConfig,
  updateExamConfigStatus,
  deleteExamConfig,
  getOverviewStats,
  getQuestionErrorStats,
  getChapterMasteryStats
}
