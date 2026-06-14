import {
  getCurrentUser,
  updateCurrentUser,
  updatePassword
} from '@/api/auth'
import { getPracticeHistory } from '@/api/practice'
import {
  getMyTrend,
  listMyQuestionReports
} from '@/api/learning'

export const getUserInfo = getCurrentUser
export const updateUserInfo = updateCurrentUser
export const changePassword = updatePassword
export const getPracticeRecords = getPracticeHistory
export const getLearningTrend = getMyTrend
export const getMyReports = listMyQuestionReports

export default {
  getUserInfo,
  updateUserInfo,
  changePassword,
  getPracticeRecords,
  getLearningTrend,
  getMyReports
}
