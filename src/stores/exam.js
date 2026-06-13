import { defineStore } from 'pinia'
import { getAttempt, saveAnswer, submitAttempt } from '@/api/exam'
import { parseAnswerArray } from '@/utils/helpers'

export const useExamStore = defineStore('exam', {
  state: () => ({
    attempt: null,
    answers: {},
    currentIndex: 0,
    loading: false
  }),

  getters: {
    questions: (state) => state.attempt?.questions || [],
    currentQuestion: (state) => state.attempt?.questions?.[state.currentIndex] || null,
    totalCount: (state) => state.attempt?.questions?.length || 0,
    answeredCount: (state) => Object.values(state.answers).filter((item) => item?.length).length,
    isSubmitted: (state) => state.attempt?.status === 2
  },

  actions: {
    setAttempt(attempt) {
      this.attempt = attempt
      const nextAnswers = {}
      ;(attempt?.questions || []).forEach((question) => {
        nextAnswers[question.id] = parseAnswerArray(question.answer?.userAnswerJson)
      })
      this.answers = nextAnswers
      this.currentIndex = 0
    },

    async loadAttempt(attemptId) {
      this.loading = true
      try {
        const attempt = await getAttempt(attemptId)
        this.setAttempt(attempt)
        return attempt
      } finally {
        this.loading = false
      }
    },

    setAnswer(attemptQuestionId, answers) {
      this.answers[attemptQuestionId] = Array.isArray(answers) ? answers : [answers]
    },

    async persistAnswer(attemptQuestionId) {
      if (!this.attempt?.id) return false
      return saveAnswer(this.attempt.id, {
        attemptQuestionId,
        answers: this.answers[attemptQuestionId] || []
      })
    },

    goToQuestion(index) {
      if (index >= 0 && index < this.totalCount) {
        this.currentIndex = index
      }
    },

    async submit() {
      if (!this.attempt?.id) return null
      const result = await submitAttempt(this.attempt.id)
      this.setAttempt(result)
      return result
    },

    clear() {
      this.attempt = null
      this.answers = {}
      this.currentIndex = 0
    }
  }
})
