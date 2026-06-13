import {
  listWrongQuestions,
  removeWrongQuestion,
  listFavorites,
  addFavorite,
  removeFavorite
} from '@/api/learning'

export const getWrongQuestions = (params = {}) => listWrongQuestions(params)
export const removeWrong = (questionId) => removeWrongQuestion(questionId)

export {
  listWrongQuestions,
  removeWrongQuestion,
  listFavorites,
  addFavorite,
  removeFavorite
}

export default {
  getWrongQuestions,
  removeWrong,
  listWrongQuestions,
  removeWrongQuestion,
  listFavorites,
  addFavorite,
  removeFavorite
}
