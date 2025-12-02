import request from '@/utils/request'

/**
 * 获取练习题目
 * @param {Object} params - { courseId, chapterId, page, size }
 */
export const getPracticeQuestions = (params) => {
  return request({
    url: '/practice/questions',
    method: 'GET',
    params
  })
}

/**
 * 提交练习记录（可选）
 * @param {Object} data - 练习数据
 */
export const submitPracticeRecord = (data) => {
  return request({
    url: '/practice/submit',
    method: 'POST',
    data
  })
}

export default {
  getPracticeQuestions,
  submitPracticeRecord
}
