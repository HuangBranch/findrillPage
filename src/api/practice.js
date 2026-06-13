import {
  listExamConfigs,
  startExam,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getExamHistory
} from '@/api/exam'

export const listPracticeConfigs = (params = {}) => listExamConfigs({ mode: 1, ...params })
export const startPractice = (configId, practiceMode = 1) => startExam({ configId, practiceMode })
export const getPracticeAttempt = getAttempt
export const savePracticeAnswer = saveAnswer
export const submitPractice = submitAttempt
export const getPracticeResult = getAttemptResult
export const getPracticeList = getExamHistory

export default {
  listPracticeConfigs,
  startPractice,
  getPracticeAttempt,
  savePracticeAnswer,
  submitPractice,
  getPracticeResult,
  getPracticeList
}
