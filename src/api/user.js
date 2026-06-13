import {
  getCurrentUser,
  updateCurrentUser,
  updatePassword
} from '@/api/auth'
import {
  getExamHistory
} from '@/api/exam'
import {
  getMyTrend,
  listChapterProgress,
  listQuestionStates,
  listMyQuestionReports
} from '@/api/learning'

export const getUserInfo = getCurrentUser
export const updateUserInfo = updateCurrentUser
export const changePassword = updatePassword
export const getExamRecords = getExamHistory
export const getPracticeRecords = getExamHistory
export const getLearningTrend = getMyTrend
export const getChapterProgress = listChapterProgress
export const getQuestionStates = listQuestionStates
export const getMyReports = listMyQuestionReports

export default {
  getUserInfo,
  updateUserInfo,
  changePassword,
  getExamRecords,
  getPracticeRecords,
  getLearningTrend,
  getChapterProgress,
  getQuestionStates,
  getMyReports
}
