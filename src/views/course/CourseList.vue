<template>
  <div class="page">
    <section class="surface">
      <el-skeleton :loading="loading" animated :rows="5">
        <el-empty v-if="!courseCards.length" description="暂无可用课程" />
        <div v-else class="course-list">
          <el-card v-for="course in courseCards" :key="course.id" class="course-card" shadow="never">
            <template #header>
              <div class="course-card__header">
                <button class="course-card__title" type="button" @click="router.push(`/courses/${course.id}/chapters`)">
                  {{ course.name }}
                </button>
                <el-button class="course-card__action" text type="primary" @click="router.push(`/courses/${course.id}/chapters`)">
                  进入
                </el-button>
              </div>
            </template>
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
.course-list {
  display: grid;
  gap: 12px;
  align-items: stretch;
}

.course-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.course-card__title {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
}

.course-card__title:hover {
  text-decoration: underline;
}

.course-card :deep(.el-card__body) {
  display: none;
}

@media (max-width: 760px) {
  :deep(.el-card__header) {
    padding: 12px 14px;
  }

  .course-card__header {
    align-items: flex-start;
    gap: 10px;
  }

  .course-card__title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .course-card__action {
    flex: none;
    padding: 0;
    min-height: 0;
  }
}

@media (min-width: 761px) {
  .course-list {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}
</style>
