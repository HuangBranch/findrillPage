import { defineStore } from 'pinia'

export const useCourseStore = defineStore('course', {
  state: () => ({
    currentCourse: null,
    currentChapter: null,
    configs: [],
    progress: []
  }),

  getters: {
    currentCourseId: (state) => state.currentCourse?.id || state.currentCourse?.curriculumId || null,
    currentChapterId: (state) => state.currentChapter?.id || state.currentChapter?.chapterId || null
  },

  actions: {
    setCurrentCourse(course) {
      this.currentCourse = course
    },
    setCurrentChapter(chapter) {
      this.currentChapter = chapter
    },
    setConfigs(configs) {
      this.configs = configs || []
    },
    setProgress(progress) {
      this.progress = progress || []
    },
    clearCurrent() {
      this.currentCourse = null
      this.currentChapter = null
    }
  }
})
