import * as XLSX from 'xlsx'

/**
 * 解析 Excel 文件为题目数据
 * @param {File} file - Excel 文件对象
 * @returns {Promise} 返回解析后的题目数组
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // 将工作表转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // 转换数据格式
        const questions = jsonData.map((row, index) => {
          return formatQuestionData(row, index)
        })

        // 验证数据
        const { valid, errors } = validateQuestions(questions)

        if (valid) {
          resolve({ success: true, data: questions })
        } else {
          resolve({ success: false, errors })
        }
      } catch (error) {
        reject(new Error('Excel 文件解析失败：' + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * 格式化题目数据
 * @param {Object} row - Excel 行数据
 * @param {Number} index - 行索引
 * @returns {Object} 格式化后的题目对象
 */
const formatQuestionData = (row, index) => {
  const question = {
    rowNumber: index + 2, // Excel 行号（从2开始，因为第1行是表头）
    year: row['年份'] || new Date().getFullYear(),
    type: row['题型'] || 'single',
    difficulty: row['难度'] || 2,
    knowledgePoint: row['知识点'] || '',
    questionTitle: row['题目标题'] || row['题目'] || '',
    options: {},
    answer: [],
    analysis: row['解析'] || ''
  }

  // 处理选项
  const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F']
  optionKeys.forEach((key) => {
    const optionValue = row[`选项${key}`] || row[key]
    if (optionValue) {
      question.options[key] = optionValue
    }
  })

  // 处理答案（支持多个答案，如 "A,B" 或 "A" 或 "AB"）
  const answerStr = String(row['答案'] || row['正确答案'] || '').trim().toUpperCase()
  if (answerStr) {
    // 如果包含逗号，按逗号分割
    if (answerStr.includes(',')) {
      question.answer = answerStr.split(',').map((a) => a.trim()).filter(Boolean)
    }
    // 如果包含分号，按分号分割
    else if (answerStr.includes(';') || answerStr.includes('；')) {
      question.answer = answerStr.split(/[;；]/).map((a) => a.trim()).filter(Boolean)
    }
    // 否则按字符拆分（如 "AB" -> ["A", "B"]）
    else {
      question.answer = answerStr.split('').filter((c) => /[A-F]/.test(c))
    }
  }

  return question
}

/**
 * 验证题目数据
 * @param {Array} questions - 题目数组
 * @returns {Object} 返回验证结果
 */
const validateQuestions = (questions) => {
  const errors = []

  questions.forEach((q) => {
    const rowErrors = []

    // 必填字段验证
    if (!q.questionTitle) {
      rowErrors.push('题目标题不能为空')
    }

    // 题型验证
    if (!['single', 'multiple', 'judge'].includes(q.type)) {
      rowErrors.push(`题型不正确，应为 single/multiple/judge，当前为：${q.type}`)
    }

    // 选项验证（判断题除外）
    if (q.type !== 'judge') {
      const optionCount = Object.keys(q.options).length
      if (optionCount < 2) {
        rowErrors.push('至少需要2个选项')
      }
    }

    // 答案验证
    if (q.answer.length === 0) {
      rowErrors.push('答案不能为空')
    }

    // 答案与选项匹配验证
    if (q.type !== 'judge') {
      const invalidAnswers = q.answer.filter((ans) => !q.options[ans])
      if (invalidAnswers.length > 0) {
        rowErrors.push(`答案 ${invalidAnswers.join(', ')} 在选项中不存在`)
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: q.rowNumber,
        errors: rowErrors
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 下载 Excel 模板
 */
export const downloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    {
      年份: 2024,
      题型: 'single',
      难度: 2,
      知识点: '物理层',
      题目标题: 'OSI 参考模型的最底层是？',
      选项A: '物理层',
      选项B: '数据链路层',
      选项C: '网络层',
      选项D: '传输层',
      答案: 'A',
      解析: '物理层负责比特流的透明传输'
    },
    {
      年份: 2024,
      题型: 'multiple',
      难度: 3,
      知识点: '传输层',
      题目标题: '以下哪些属于传输层协议？',
      选项A: 'TCP',
      选项B: 'UDP',
      选项C: 'IP',
      选项D: 'HTTP',
      答案: 'A,B',
      解析: 'TCP 和 UDP 都是传输层协议'
    }
  ]

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(templateData)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 8 },  // 年份
    { wch: 10 }, // 题型
    { wch: 8 },  // 难度
    { wch: 15 }, // 知识点
    { wch: 50 }, // 题目标题
    { wch: 30 }, // 选项A
    { wch: 30 }, // 选项B
    { wch: 30 }, // 选项C
    { wch: 30 }, // 选项D
    { wch: 10 }, // 答案
    { wch: 50 }  // 解析
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '题目模板')

  // 下载文件
  XLSX.writeFile(workbook, '题目导入模板.xlsx')
}

export default {
  parseExcelFile,
  downloadTemplate
}
