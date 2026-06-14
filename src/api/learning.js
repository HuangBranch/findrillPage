import request from '@/utils/request'

export const listWrongQuestions = (params = {}) => request({ url: '/learning/wrong-questions', method: 'GET', params })

export const removeWrongQuestion = (questionId) =>
  request({ url: `/learning/wrong-questions/${questionId}`, method: 'DELETE' })

export const listFavorites = () => request({ url: '/learning/favorites', method: 'GET' })

export const addFavorite = (questionId) => request({ url: `/learning/favorites/${questionId}`, method: 'POST' })

export const removeFavorite = (questionId) => request({ url: `/learning/favorites/${questionId}`, method: 'DELETE' })

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
  createQuestionReport,
  listMyQuestionReports,
  getMyTrend
}
