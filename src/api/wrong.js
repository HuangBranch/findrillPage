import request from '@/utils/request'

/**
 * 获取错题概览
 */
export const getWrongSummary = () => {
  return request({
    url: '/wrong-questions/summary',
    method: 'GET'
  })
}

/**
 * 获取错题列表
 * @param {Object} params - { courseId, chapterId, page, size }
 */
export const getWrongList = (params) => {
  return request({
    url: '/wrong/list',
    method: 'GET',
    params
  })
}

/**
 * 错题练习抽题
 * @param {Object} params - { courseId, chapterId, count }
 */
export const getWrongPracticeQuestions = (params) => {
  return request({
    url: '/wrong/practice',
    method: 'GET',
    params
  })
}

/**
 * 错题作答判题（更新错题统计）
 * @param {Object} data - { questionId, isCorrect }
 */
export const submitWrongAnswer = (data) => {
  return request({
    url: '/wrong-questions/answer',
    method: 'POST',
    data
  })
}

/**
 * 移除单个错题
 * @param {Number} id - 错题记录ID
 */
export const removeWrongQuestion = (id) => {
  return request({
    url: `/wrong/{id}/remove`,
    method: 'PATCH'
  })
}

/**
 * 批量移除错题
 * @param {Object} data - { ids: [wrongId1, wrongId2, ...] }
 */
export const batchRemoveWrong = (data) => {
  return request({
    url: '/wrong-questions/batch-remove',
    method: 'POST',
    data
  })
}

export default {
  getWrongSummary,
  getWrongList,
  getWrongPracticeQuestions,
  submitWrongAnswer,
  removeWrongQuestion,
  batchRemoveWrong
}
