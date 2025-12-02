import request from '@/utils/request'

/**
 * 获取章节列表
 * @param {Object} params - { courseId }
 */
export const getChapterList = (params) => {
  return request({
    url: '/chapters',
    method: 'GET',
    params
  })
}

/**
 * 获取章节详情
 * @param {Number} chapterId - 章节ID
 */
export const getChapterDetail = (chapterId) => {
  return request({
    url: `/chapters/${chapterId}`,
    method: 'GET'
  })
}

export default {
  getChapterList,
  getChapterDetail
}
