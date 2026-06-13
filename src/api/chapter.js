import { listChapterProgress } from '@/api/learning'
import request from '@/utils/request'
import { listChapters as listAdminChapters } from '@/api/admin'

export const getChapterList = (curriculumId, config = {}) =>
  request({ url: '/chapters/list', method: 'GET', params: { curriculumId }, ...config })
export const getChapter = (id, config = {}) => request({ url: `/chapters/${id}`, method: 'GET', ...config })
export const getChapterProgress = (params = {}) => listChapterProgress(params)
export const getAdminChapterList = (params = {}, config = {}) => listAdminChapters(params, config)

export default {
  getChapterList,
  getChapter,
  getChapterProgress,
  getAdminChapterList
}
