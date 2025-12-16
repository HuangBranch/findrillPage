<template>
  <AdminLayout>
    <div class="dashboard-page">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon user">
                <el-icon :size="32"><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.userCount }}</div>
                <div class="stat-label">用户总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon course">
                <el-icon :size="32"><Reading /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.courseCount }}</div>
                <div class="stat-label">课程数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon question">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.questionCount }}</div>
                <div class="stat-label">题目数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="12" :sm="12" :md="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon exam">
                <el-icon :size="32"><Tickets /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.examCount }}</div>
                <div class="stat-label">考试次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>用户增长趋势</span>
                <el-radio-group v-model="userChartType" size="small">
                  <el-radio-button value="week">本周</el-radio-button>
                  <el-radio-button value="month">本月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-icon :size="64" color="#909399"><TrendCharts /></el-icon>
                <p>用户增长图表</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>考试情况统计</span>
                <el-radio-group v-model="examChartType" size="small">
                  <el-radio-button value="week">本周</el-radio-button>
                  <el-radio-button value="month">本月</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <el-icon :size="64" color="#909399"><PieChart /></el-icon>
                <p>考试统计图表</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近活动 -->
      <el-row :gutter="20">
        <el-col :xs="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近考试记录</span>
                <el-button text type="primary" @click="$router.push('/admin/traces')">
                  查看更多 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <el-table :data="recentExams" style="width: 100%">
              <el-table-column prop="userName" label="用户" width="120" />
              <el-table-column prop="courseName" label="课程" min-width="150" />
              <el-table-column prop="chapterName" label="章节" min-width="150" />
              <el-table-column prop="score" label="成绩" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.score >= 60 ? 'success' : 'danger'">
                    {{ row.score }}分
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="时间" width="180" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { User, Reading, Document, Tickets, TrendCharts, PieChart, ArrowRight } from '@element-plus/icons-vue'

// 统计数据
const stats = ref({
  userCount: 156,
  courseCount: 12,
  questionCount: 2450,
  examCount: 3280
})

// 图表类型
const userChartType = ref('week')
const examChartType = ref('week')

// 最近考试记录
const recentExams = ref([
  {
    userName: '张三',
    courseName: 'Java 基础',
    chapterName: '第一章',
    score: 85,
    createTime: '2025-12-16 14:30:25'
  },
  {
    userName: '李四',
    courseName: 'Python 入门',
    chapterName: '第二章',
    score: 92,
    createTime: '2025-12-16 14:25:10'
  },
  {
    userName: '王五',
    courseName: 'JavaScript 高级',
    chapterName: '第三章',
    score: 58,
    createTime: '2025-12-16 14:20:05'
  },
  {
    userName: '赵六',
    courseName: 'Vue 3 实战',
    chapterName: '第一章',
    score: 78,
    createTime: '2025-12-16 14:15:30'
  },
  {
    userName: '钱七',
    courseName: 'React 开发',
    chapterName: '第二章',
    score: 95,
    createTime: '2025-12-16 14:10:20'
  }
])

onMounted(() => {
  // 这里将来可以调用API获取真实数据
  console.log('Dashboard mounted')
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.course {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.question {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.exam {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
}

.chart-placeholder p {
  margin-top: 16px;
  font-size: 14px;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .stat-value {
    font-size: 26px;
  }
  
  .stat-icon {
    width: 56px;
    height: 56px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .stats-row {
    margin-bottom: 16px;
  }
  
  .stat-card {
    margin-bottom: 10px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 13px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
  }
  
  .stat-icon :deep(.el-icon) {
    font-size: 24px !important;
  }
  
  .stat-content {
    gap: 12px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .charts-row {
    margin-bottom: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .stat-value {
    font-size: 22px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .stat-icon {
    width: 44px;
    height: 44px;
  }
  
  .stat-icon :deep(.el-icon) {
    font-size: 20px !important;
  }
  
  .chart-container {
    height: 220px;
  }
}
</style>
