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
 * 获取刷题记录
 * @param {Object} params - { courseId, chapterId, page, size }
 */
export const getPracticeList = () => {
  return request({
    url: '/practice/list',
    method: 'GET',
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

/**
 * 获取练习结果
 * @param {Number} examId - 练习记录ID
 */
 export const getPracticeResult = (examId) => {
  return request({
    url: `/practice/result/${examId}`,
    method: 'GET',
  })
}

/**
 * 获取练习详细结果
 * @param {Number} examId - 练习记录ID
 */
 export const getPracticeDetailedResult = (examId) => {
  return request({
    url: `/api/exam/${examId}`,
    method: 'GET',
  })
}

export default {
  getPracticeQuestions,
  submitPracticeRecord,
  getPracticeList,
  getPracticeResult
}
