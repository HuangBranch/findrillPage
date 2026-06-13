import request from '@/utils/request'

export const startPractice = (data) => request({ url: '/practice/start', method: 'POST', data })

export const getPracticeAttempt = (attemptId) => request({ url: `/practice/${attemptId}`, method: 'GET' })

export const savePracticeAnswer = (attemptId, data) =>
  request({ url: `/practice/${attemptId}/answer`, method: 'PUT', data })

export const submitPractice = (attemptId) =>
  request({ url: `/practice/${attemptId}/submit`, method: 'POST' })

export const getPracticeResult = (attemptId) =>
  request({ url: `/practice/${attemptId}/result`, method: 'GET' })

export const getPracticeHistory = () => request({ url: '/practice/history', method: 'GET' })

export const getPracticeList = getPracticeHistory

export default {
  startPractice,
  getPracticeAttempt,
  savePracticeAnswer,
  submitPractice,
  getPracticeResult,
  getPracticeHistory,
  getPracticeList
}
