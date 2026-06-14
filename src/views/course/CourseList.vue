<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">学习中心</h1>
        <p class="page-subtitle">选择课程后进入章节题库，开始自主练习。</p>
      </div>
    </div>

    <section class="surface">
      <el-skeleton :loading="loading" animated :rows="5">
        <el-empty v-if="!courseCards.length" description="暂无可用课程" />
        <div v-else class="card-grid">
          <el-card v-for="course in courseCards" :key="course.id" shadow="never">
            <template #header>
              <div class="course-card__header">
                <strong class="course-card__title" @click="router.push(`/courses/${course.id}/chapters`)">{{ course.name }}</strong>
              </div>
            </template>
            <div class="course-card__body">
              <p>{{ course.remarks || `课程 ID：${course.id}` }}</p>
            </div>
          </el-card>
        </div>
      </el-skeleton>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCourseList } from '@/api/course'

const router = useRouter()
const loading = ref(false)
const courses = ref([])

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const courseCards = computed(() =>
  courses.value
    .filter((course) => course.isUse !== false && course.enabled !== false)
)

const loadData = async () => {
  loading.value = true
  try {
    const courseRows = await getCourseList({ enabled: true })
    courses.value = normalizeRows(courseRows)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-grid {
  align-items: stretch;
}

.course-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.course-card__title {
  cursor: pointer;
  color: var(--el-color-primary);
}

.course-card__title:hover {
  text-decoration: underline;
}

.course-card__body {
  display: grid;
  gap: 10px;
  color: #64748b;
}

@media (max-width: 760px) {
  :deep(.el-card__header) {
    padding: 10px 12px;
  }

  :deep(.el-card__body) {
    padding: 8px 12px;
  }

  :deep(.el-card__footer) {
    padding: 10px 12px;
  }

  .course-card__header strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .course-card__body {
    gap: 6px;
  }

  .course-card__body p {
    display: none;
  }

  :deep(.el-card__footer .toolbar) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  :deep(.el-card__footer .el-button) {
    min-height: 34px;
    margin-left: 0;
    padding: 8px 10px;
  }
}
</style>
