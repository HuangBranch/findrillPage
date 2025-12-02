import { defineStore } from 'pinia'

export const useCourseStore = defineStore('course', {
  state: () => ({
    currentCourse: null, // 当前选中的课程
    currentChapter: null, // 当前选中的章节
    courseList: [], // 课程列表缓存
    chapterList: [] // 章节列表缓存
  }),

  getters: {
    // 当前课程ID
    currentCourseId: (state) => state.currentCourse?.cId || null,
    
    // 当前章节ID
    currentChapterId: (state) => state.currentChapter?.chapterId || null
  },

  actions: {
    // 设置当前课程
    setCurrentCourse(course) {
      this.currentCourse = course
    },

    // 设置当前章节
    setCurrentChapter(chapter) {
      this.currentChapter = chapter
    },

    // 缓存课程列表
    setCourseList(list) {
      this.courseList = list
    },

    // 缓存章节列表
    setChapterList(list) {
      this.chapterList = list
    },

    // 清除当前选择
    clearCurrent() {
      this.currentCourse = null
      this.currentChapter = null
    }
  }
})
