import {
  listWrongQuestions,
  removeWrongQuestion
} from '@/api/learning'

export const getWrongQuestions = (params = {}) => listWrongQuestions(params)
export const removeWrong = (questionId) => removeWrongQuestion(questionId)

export {
  listWrongQuestions,
  removeWrongQuestion
}

export default {
  getWrongQuestions,
  removeWrong,
  listWrongQuestions,
  removeWrongQuestion
}
