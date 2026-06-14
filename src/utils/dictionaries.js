export const QUESTION_TYPES = [
  { label: '单选题', value: 1 },
  { label: '多选题', value: 2 },
  { label: '判断题', value: 3 },
  { label: '填空题', value: 4 },
  { label: '简答题', value: 5 }
]

export const PRACTICE_SOURCE_TYPES = [
  { label: '章节题库', value: 1, tag: 'success' },
  { label: '错题练习', value: 2, tag: 'warning' }
]

export const PRACTICE_ORDER_TYPES = [
  { label: '顺序', value: 1 },
  { label: '随机', value: 2 }
]

export const DIFFICULTIES = [
  { label: '简单', value: 1, tag: 'success' },
  { label: '中等', value: 2, tag: 'warning' },
  { label: '困难', value: 3, tag: 'danger' }
]

export const QUESTION_STATUS = [
  { label: '停用', value: 0, tag: 'info' },
  { label: '启用', value: 1, tag: 'success' }
]

export const AUDIT_STATUS = [
  { label: '草稿', value: 1, tag: 'info' },
  { label: '待审核', value: 2, tag: 'warning' },
  { label: '已发布', value: 3, tag: 'success' },
  { label: '已驳回', value: 4, tag: 'danger' }
]

export const ATTEMPT_STATUS = [
  { label: '进行中', value: 1, tag: 'warning' },
  { label: '已提交', value: 2, tag: 'success' }
]

export const REPORT_REASONS = [
  { label: '题干有误', value: 1 },
  { label: '答案有误', value: 2 },
  { label: '解析有误', value: 3 },
  { label: '其他问题', value: 4 }
]

export const REPORT_STATUS = [
  { label: '待处理', value: 1, tag: 'warning' },
  { label: '已处理', value: 2, tag: 'success' },
  { label: '已忽略', value: 3, tag: 'info' }
]

export const labelOf = (options, value, fallback = '-') =>
  options.find((item) => item.value === value)?.label || fallback

export const tagOf = (options, value, fallback = 'info') =>
  options.find((item) => item.value === value)?.tag || fallback
