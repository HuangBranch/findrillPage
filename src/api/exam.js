import request from '@/utils/request'

export const listExamConfigs = (params = {}) => request({ url: '/exams/configs', method: 'GET', params })

export const startExam = (data) => request({ url: '/exams/start', method: 'POST', data })

export const getAttempt = (attemptId) => request({ url: `/exams/${attemptId}`, method: 'GET' })

export const saveAnswer = (attemptId, data) => request({ url: `/exams/${attemptId}/answer`, method: 'PUT', data })

export const submitAttempt = (attemptId) => request({ url: `/exams/${attemptId}/submit`, method: 'POST' })

export const getAttemptResult = (attemptId) => request({ url: `/exams/${attemptId}/result`, method: 'GET' })

export const getExamHistory = () => request({ url: '/exams/history', method: 'GET' })

export default {
  listExamConfigs,
  startExam,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getExamHistory
}
