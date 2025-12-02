<template>
  <el-button 
    class="answer-card-btn"
    :icon="Grid"
    @click="showDrawer = true"
  >
    答题卡
  </el-button>

  <el-drawer
    v-model="showDrawer"
    title="答题卡"
    size="80%"
    :style="{ maxWidth: '400px' }"
  >
    <div class="answer-sheet">
      <div class="sheet-stats">
        <div class="stat-item">
          <span class="stat-label">已答</span>
          <span class="stat-value">{{ answeredCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">未答</span>
          <span class="stat-value">{{ unansweredCount }}</span>
        </div>
        <div v-if="showTimer" class="stat-item">
          <span class="stat-label">剩余时间</span>
          <span class="stat-value timer">{{ remainingTime }}</span>
        </div>
      </div>
      
      <el-divider />
      
      <div class="sheet-grid">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="sheet-item"
          :class="{
            answered: isAnswered(index),
            active: currentIndex === index
          }"
          @click="handleJump(index)"
        >
          {{ index + 1 }}
        </div>
      </div>
      
      <div v-if="showSubmitButton" class="sheet-footer">
        <el-button type="primary" size="large" @click="handleSubmit" style="width: 100%">
          提交试卷
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  userAnswers: {
    type: Array,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  },
  showTimer: {
    type: Boolean,
    default: false
  },
  remainingTime: {
    type: String,
    default: ''
  },
  showSubmitButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['jump', 'submit'])

const showDrawer = ref(false)

const answeredCount = computed(() => 
  props.userAnswers.filter(a => Array.isArray(a) ? a.length > 0 : a).length
)

const unansweredCount = computed(() => 
  props.questions.length - answeredCount.value
)

const isAnswered = (index) => {
  const answer = props.userAnswers[index]
  return Array.isArray(answer) ? answer.length > 0 : !!answer
}

const handleJump = (index) => {
  showDrawer.value = false
  emit('jump', index)
}

const handleSubmit = () => {
  showDrawer.value = false
  emit('submit')
}
</script>

<style scoped>
.answer-card-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 100;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.answer-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sheet-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #909399;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #409eff;
}

.stat-value.timer {
  color: #f56c6c;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
}

.sheet-item {
  aspect-ratio: 1;
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.sheet-item:active {
  transform: scale(0.95);
}

.sheet-item.answered {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.sheet-item.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.sheet-footer {
  padding-top: 1rem;
  border-top: 1px solid #e4e7ed;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .answer-card-btn {
    bottom: 80px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
}
</style>
