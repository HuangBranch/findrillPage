import { defineStore } from 'pinia'
import { generateId } from '@/utils/helpers'
import { 
  saveExamProgress, 
  getExamProgress, 
  clearExamProgress,
  savePracticeProgress,
  getPracticeProgress,
  clearPracticeProgress
} from '@/utils/storage'
import { useAuthStore } from './auth'

export const useExamStore = defineStore('exam', {
  state: () => ({
    // 考试模式
    examId: null, // 考试ID
    examQuestions: [], // 题目列表
    examAnswers: {}, // 用户答案 { questionId: ['A'] }
    currentIndex: 0, // 当前题目索引
    startTime: null, // 开始时间
    remainingTime: 0, // 剩余秒数
    isExamMode: false, // 是否是考试模式

    // 刷题模式
    practiceSessionId: null, // 刷题会话ID
    practiceQuestions: [], // 题目列表
    practiceAnswers: {}, // 用户答案
    viewedAnalysis: [], // 已查看解析的题目ID列表
    isPracticeMode: false // 是否是刷题模式
  }),

  getters: {
    // 当前题目
    currentQuestion: (state) => {
      if (state.isExamMode) {
        return state.examQuestions[state.currentIndex] || null
      }
      return state.practiceQuestions[state.currentIndex] || null
    },

    // 总题数
    totalCount: (state) => {
      if (state.isExamMode) {
        return state.examQuestions.length
      }
      return state.practiceQuestions.length
    },

    // 已答题数
    answeredCount: (state) => {
      if (state.isExamMode) {
        return Object.keys(state.examAnswers).length
      }
      return Object.keys(state.practiceAnswers).length
    },

    // 是否答完所有题
    isAllAnswered: (state) => {
      const answers = state.isExamMode ? state.examAnswers : state.practiceAnswers
      const questions = state.isExamMode ? state.examQuestions : state.practiceQuestions
      return Object.keys(answers).length === questions.length
    }
  },

  actions: {
    /**
     * ========== 考试模式 ==========
     */

    // 初始化考试
    initExam(questions, duration = 3600) {
      this.examId = generateId()
      this.examQuestions = questions
      this.examAnswers = {}
      this.currentIndex = 0
      this.startTime = new Date().toISOString()
      this.remainingTime = duration
      this.isExamMode = true

      // 自动保存
      this.saveExamProgressToStorage()
    },

    // 从存储恢复考试进度
    restoreExamProgress(userId) {
      const authStore = useAuthStore()
      const progress = getExamProgress(userId || authStore.userInfo?.id, this.examId)
      
      if (progress) {
        this.examQuestions = progress.questions || []
        this.examAnswers = progress.answers || {}
        this.currentIndex = progress.currentIndex || 0
        this.startTime = progress.startTime
        this.remainingTime = progress.remainingTime
        this.isExamMode = true
        return true
      }
      return false
    },

    // 保存考试进度到存储
    saveExamProgressToStorage() {
      const authStore = useAuthStore()
      const userId = authStore.userInfo?.id
      if (!userId || !this.examId) return

      const progress = {
        examId: this.examId,
        questions: this.examQuestions,
        answers: this.examAnswers,
        currentIndex: this.currentIndex,
        startTime: this.startTime,
        remainingTime: this.remainingTime
      }

      saveExamProgress(userId, this.examId, progress)
    },

    // 设置考试答案
    setExamAnswer(questionId, answer) {
      this.examAnswers[questionId] = answer
      this.saveExamProgressToStorage()
    },

    // 跳转到指定题目
    goToQuestion(index) {
      if (index >= 0 && index < this.totalCount) {
        this.currentIndex = index
        this.saveExamProgressToStorage()
      }
    },

    // 更新剩余时间
    updateRemainingTime(seconds) {
      this.remainingTime = seconds
      // 每30秒保存一次
      if (seconds % 30 === 0) {
        this.saveExamProgressToStorage()
      }
    },

    // 提交考试（清除进度）
    submitExam() {
      const authStore = useAuthStore()
      const userId = authStore.userInfo?.id
      if (userId && this.examId) {
        clearExamProgress(userId, this.examId)
      }
      this.clearExam()
    },

    // 清除考试状态
    clearExam() {
      this.examId = null
      this.examQuestions = []
      this.examAnswers = {}
      this.currentIndex = 0
      this.startTime = null
      this.remainingTime = 0
      this.isExamMode = false
    },

    /**
     * ========== 刷题模式 ==========
     */

    // 初始化刷题
    initPractice(questions) {
      this.practiceSessionId = generateId()
      this.practiceQuestions = questions
      this.practiceAnswers = {}
      this.viewedAnalysis = []
      this.currentIndex = 0
      this.isPracticeMode = true

      // 自动保存
      this.savePracticeProgressToStorage()
    },

    // 从存储恢复刷题进度
    restorePracticeProgress(userId) {
      const authStore = useAuthStore()
      const progress = getPracticeProgress(
        userId || authStore.userInfo?.id, 
        this.practiceSessionId
      )
      
      if (progress) {
        this.practiceQuestions = progress.questions || []
        this.practiceAnswers = progress.answers || {}
        this.viewedAnalysis = progress.viewedAnalysis || []
        this.currentIndex = progress.currentIndex || 0
        this.isPracticeMode = true
        return true
      }
      return false
    },

    // 保存刷题进度到存储
    savePracticeProgressToStorage() {
      const authStore = useAuthStore()
      const userId = authStore.userInfo?.id
      if (!userId || !this.practiceSessionId) return

      const progress = {
        sessionId: this.practiceSessionId,
        questions: this.practiceQuestions,
        answers: this.practiceAnswers,
        viewedAnalysis: this.viewedAnalysis,
        currentIndex: this.currentIndex
      }

      savePracticeProgress(userId, this.practiceSessionId, progress)
    },

    // 设置刷题答案
    setPracticeAnswer(questionId, answer) {
      this.practiceAnswers[questionId] = answer
      this.savePracticeProgressToStorage()
    },

    // 标记已查看解析
    markAnalysisViewed(questionId) {
      if (!this.viewedAnalysis.includes(questionId)) {
        this.viewedAnalysis.push(questionId)
        this.savePracticeProgressToStorage()
      }
    },

    // 完成刷题（清除进度）
    finishPractice() {
      const authStore = useAuthStore()
      const userId = authStore.userInfo?.id
      if (userId && this.practiceSessionId) {
        clearPracticeProgress(userId, this.practiceSessionId)
      }
      this.clearPractice()
    },

    // 清除刷题状态
    clearPractice() {
      this.practiceSessionId = null
      this.practiceQuestions = []
      this.practiceAnswers = {}
      this.viewedAnalysis = []
      this.currentIndex = 0
      this.isPracticeMode = false
    }
  }
})
