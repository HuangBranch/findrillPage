import {
  getCurrentUser,
  updateCurrentUser,
  updatePassword
} from '@/api/auth'
import { getPracticeHistory } from '@/api/practice'
import {
  getMyTrend,
  listChapterProgress,
  listQuestionStates,
  listMyQuestionReports
} from '@/api/learning'

export const getUserInfo = getCurrentUser
export const updateUserInfo = updateCurrentUser
export const changePassword = updatePassword
export const getPracticeRecords = getPracticeHistory
export const getLearningTrend = getMyTrend
export const getChapterProgress = listChapterProgress
export const getQuestionStates = listQuestionStates
export const getMyReports = listMyQuestionReports

export default {
  getUserInfo,
  updateUserInfo,
  changePassword,
  getPracticeRecords,
  getLearningTrend,
  getChapterProgress,
  getQuestionStates,
  getMyReports
}
