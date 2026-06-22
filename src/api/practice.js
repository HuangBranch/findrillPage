import request from '@/utils/request'

/**
 * @typedef {Object} PracticeAttemptQuestion
 * @property {number|string} id
 * @property {number|string} [attemptQuestionId]
 * @property {number|string} [questionId]
 * @property {number} type
 * @property {string|Array} [answersJson]
 * @property {number} [blankCount]
 * @property {string} stemHtml
 * @property {string|Array} [optionsJson]
 * @property {string} [analysisHtml]
 */

/**
 * @typedef {Object} PracticeAnswerResult
 * @property {number|string} [attemptQuestionId]
 * @property {number|string} [questionId]
 * @property {string|Array} [userAnswerJson]
 * @property {string|Array} [answersJson]
 * @property {string} [analysisHtml]
 * @property {number} [judgeStatus]
 * @property {boolean} [isCorrect]
 */

export const startPractice = (data) => request({ url: '/practice/start', method: 'POST', data })

/**
 * Loads practice attempt questions only. The backend no longer returns standard
 * answers or analysis in this response.
 * @returns {Promise<{questions?: PracticeAttemptQuestion[]}>}
 */
export const getPracticeAttempt = (attemptId) => request({ url: `/practice/${attemptId}`, method: 'GET' })

/**
 * Submits one question answer and returns the judge result, standard answer and analysis.
 * @returns {Promise<PracticeAnswerResult>}
 */
export const submitPracticeAnswer = (attemptId, data) =>
  request({ url: `/practice/${attemptId}/answer`, method: 'PUT', data })

export const getPracticeResult = (attemptId) =>
  request({ url: `/practice/${attemptId}/result`, method: 'GET' })

export const getPracticeHistory = (params = {}) => request({ url: '/practice/history', method: 'GET', params })

export const getPracticeHistoryCount = () => request({ url: '/practice/history/count', method: 'GET' })

export const getPracticeList = getPracticeHistory

export default {
  startPractice,
  getPracticeAttempt,
  submitPracticeAnswer,
  getPracticeResult,
  getPracticeHistory,
  getPracticeHistoryCount,
  getPracticeList
}
