<template>
  <div 
    class="anydo-task-item"
    :class="{ 'completed': task.checked }"
    @click="handleClick"
  >
    <!-- 左侧勾选框 -->
    <div class="checkbox-container" @click.stop="toggleCheck">
      <div class="checkbox" :class="{ 'checked': task.checked }">
        <i v-if="task.checked" class="bi-check"></i>
      </div>
    </div>

    <!-- 任务内容 -->
    <div class="task-content">
      <div class="task-main">
        <span class="task-text" :class="{ 'completed-text': task.checked }">
          {{ task.text }}
        </span>
        <div v-if="task.time" class="time-tag">
          {{ formatTime(task.time) }}
        </div>
      </div>
      
      <!-- 进度条（如果有颜色标记） -->
      <div 
        v-if="task.color && task.color !== 'none' && !task.checked" 
        class="progress-bar"
        :style="{ background: task.color }"
      ></div>
      
      <!-- 附加信息 -->
      <div v-if="task.alarm || task.repeatingEvent" class="task-meta">
        <i v-if="task.alarm" class="bi-bell-fill meta-icon"></i>
        <i v-if="task.repeatingEvent" class="bi-arrow-repeat meta-icon"></i>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "AnyDoTaskItem",
  props: {
    task: {
      type: Object,
      required: true
    },
    listId: {
      type: String,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  methods: {
    toggleCheck() {
      this.$store.commit("checkTodo", {
        toDoListId: this.listId,
        index: this.index
      });
      
      // 触觉反馈
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    handleClick() {
      this.$emit("task-click", {
        toDo: this.task,
        index: this.index,
        toDoListId: this.listId
      });
    },
    formatTime(time) {
      if (!time) return "";
      return moment(time, "HH:mm").format("h:mm A");
    }
  }
};
</script>

<style scoped lang="scss">
.anydo-task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:active {
    background: rgba(0, 0, 0, 0.02);
  }
  
  &.completed {
    opacity: 0.6;
  }
  
  :global(.dark-theme) & {
    background: #1c1c1e;
    border-bottom-color: rgba(255, 255, 255, 0.05);
    
    &:active {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}

/* 勾选框 */
.checkbox-container {
  flex-shrink: 0;
  padding: 2px;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d1d6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &.checked {
    background: #4A9EFF;
    border-color: #4A9EFF;
    
    i {
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
    }
  }
  
  :global(.dark-theme) & {
    border-color: #48484a;
    
    &.checked {
      background: #0a84ff;
      border-color: #0a84ff;
    }
  }
}

/* 任务内容 */
.task-content {
  flex: 1;
  min-width: 0;
}

.task-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.task-text {
  flex: 1;
  font-size: 16px;
  color: #1a1a1a;
  line-height: 1.5;
  word-break: break-word;
  
  &.completed-text {
    text-decoration: line-through;
    color: #8e8e93;
  }
  
  :global(.dark-theme) & {
    color: #f5f5f7;
    
    &.completed-text {
      color: #636366;
    }
  }
}

.time-tag {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  
  :global(.dark-theme) & {
    background: rgba(255, 255, 255, 0.1);
    color: #8e8e93;
  }
}

/* 进度条 */
.progress-bar {
  height: 3px;
  border-radius: 2px;
  margin-top: 8px;
  opacity: 0.8;
}

/* 附加信息 */
.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  
  .meta-icon {
    font-size: 12px;
    color: #8e8e93;
  }
}

/* 动画 */
.checkbox {
  &.checked {
    animation: checkBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
