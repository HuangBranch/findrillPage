import { listExamConfigs } from '@/api/exam'
import request from '@/utils/request'
import { listCourses as listAdminCourses } from '@/api/admin'

export const getCourseList = (params = {}, config = {}) =>
  request({ url: '/courses/list', method: 'GET', params, ...config })
export const getCourse = (id, config = {}) => request({ url: `/courses/${id}`, method: 'GET', ...config })
export const getCourseConfigs = (params = {}) => listExamConfigs(params)
export const getAdminCourseList = (params = {}, config = {}) => listAdminCourses(params, config)

export default {
  getCourseList,
  getCourse,
  getCourseConfigs,
  getAdminCourseList
}
