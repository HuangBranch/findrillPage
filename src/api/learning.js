import request from '@/utils/request'

export const listWrongQuestions = (params = {}) => request({ url: '/learning/wrong-questions', method: 'GET', params })

export const removeWrongQuestion = (questionId) =>
  request({ url: `/learning/wrong-questions/${questionId}`, method: 'DELETE' })

export const listFavorites = () => request({ url: '/learning/favorites', method: 'GET' })

export const addFavorite = (questionId) => request({ url: `/learning/favorites/${questionId}`, method: 'POST' })

export const removeFavorite = (questionId) => request({ url: `/learning/favorites/${questionId}`, method: 'DELETE' })

export const getNote = (questionId) => request({ url: `/learning/notes/${questionId}`, method: 'GET', silent: true })

export const saveNote = (questionId, data) => request({ url: `/learning/notes/${questionId}`, method: 'PUT', data })

export const deleteNote = (questionId) => request({ url: `/learning/notes/${questionId}`, method: 'DELETE' })

export const listChapterProgress = (params = {}) =>
  request({ url: '/learning/progress/chapters', method: 'GET', params })

export const listQuestionStates = (params = {}) =>
  request({ url: '/learning/question-states', method: 'GET', params })

export const listReviewSchedules = (params = {}) =>
  request({ url: '/learning/review-schedules', method: 'GET', params })

export const completeReview = (scheduleId) =>
  request({ url: `/learning/review-schedules/${scheduleId}/complete`, method: 'PUT' })

export const ignoreReview = (scheduleId) =>
  request({ url: `/learning/review-schedules/${scheduleId}/ignore`, method: 'PUT' })

export const createQuestionReport = (data) => request({ url: '/question-reports', method: 'POST', data })

export const listMyQuestionReports = (params = {}) =>
  request({ url: '/question-reports/mine', method: 'GET', params })

export const getMyTrend = () => request({ url: '/statistics/me/trend', method: 'GET' })

export default {
  listWrongQuestions,
  removeWrongQuestion,
  listFavorites,
  addFavorite,
  removeFavorite,
  getNote,
  saveNote,
  deleteNote,
  listChapterProgress,
  listQuestionStates,
  listReviewSchedules,
  completeReview,
  ignoreReview,
  createQuestionReport,
  listMyQuestionReports,
  getMyTrend
}
