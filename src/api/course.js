import request from '@/utils/request'

/**
 * 获取课程列表
 * @param {Object} params - { keyword, page, size }
 */
export const getCourseList = (params) => {
  return request({
    url: '/courses',
    method: 'GET',
    params
  })
}

/**
 * 获取课程详情
 * @param {Number} courseId - 课程ID
 */
export const getCourseDetail = (courseId) => {
  return request({
    url: `/courses/${courseId}`,
    method: 'GET'
  })
}

export default {
  getCourseList,
  getCourseDetail
}
