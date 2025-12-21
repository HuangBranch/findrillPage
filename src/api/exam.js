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
 * @param {Number} examId - 考试记录ID
 */
export const getExamResult = (examId) => {
  return request({
    url: `/exam/${examId}`,
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
/**
 * 获取考试记录
 * @param {Object} params - { courseId, chapterId, page, size }
 */
export const getExamList = () => {
  return request({
    url: '/exam/list',
    method: 'GET',
  })
}
export default {
  getExamPaper,
  submitExam,
  getExamResult,
  getLastExamScore,
  getExamList
}
