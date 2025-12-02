import request from '@/utils/request'

/**
 * 获取考试试卷
 * @param {Object} params - { courseId, chapterId, count }
 */
export const getExamPaper = (params) => {
  return request({
    url: '/exam/paper',
    method: 'GET',
    params
  })
}

/**
 * 提交考试
 * @param {Object} data - 考试答案数据
 */
export const submitExam = (data) => {
  return request({
    url: '/exam/submit',
    method: 'POST',
    data
  })
}

/**
 * 获取考试结果
 * @param {Number} traceId - 考试记录ID
 */
export const getExamResult = (traceId) => {
  return request({
    url: `/exam/result/${traceId}`,
    method: 'GET'
  })
}

/**
 * 获取上次考试成绩
 * @param {Object} params - { courseId, chapterId }
 */
export const getLastExamScore = (params) => {
  return request({
    url: '/exam/last-score',
    method: 'GET',
    params
  })
}

export default {
  getExamPaper,
  submitExam,
  getExamResult,
  getLastExamScore
}
