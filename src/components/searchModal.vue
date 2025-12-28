<template>
  <transition name="search-modal">
    <div v-if="isVisible" class="search-modal-overlay" @click.self="closeSearch">
      <div class="search-modal">
        <!-- 搜索头部 -->
        <div class="search-header">
          <i class="bi-search search-icon"></i>
          <input
            ref="searchInput"
            type="text"
            class="search-input"
            :placeholder="$t('ui.search') || '搜索任务...'"
            v-model="searchQuery"
            @input="handleSearch"
            @keydown.esc="closeSearch"
            @keydown.down.prevent="selectNext"
            @keydown.up.prevent="selectPrevious"
            @keydown.enter="openSelectedTask"
          />
          <button class="search-close" @click="closeSearch">
            <i class="bi-x"></i>
          </button>
        </div>
        
        <!-- 搜索结果 -->
        <div class="search-results" v-if="searchQuery">
          <div v-if="filteredTasks.length === 0" class="search-empty">
            <i class="bi-inbox"></i>
            <p>{{ $t('ui.noResults') || '未找到任务' }}</p>
          </div>
          
          <div v-else class="search-list">
            <div
              v-for="(task, index) in filteredTasks"
              :key="task.id"
              class="search-item"
              :class="{ 'search-item-selected': index === selectedIndex }"
              @click="openTask(task)"
              @mouseenter="selectedIndex = index"
            >
              <div class="search-item-content">
                <div class="search-item-header">
                  <span class="search-item-icon" :style="{ color: task.color !== 'none' ? task.color : '#007aff' }">
                    <i :class="task.checked ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  </span>
                  <span class="search-item-text" :class="{ 'completed': task.checked }">
                    {{ task.text }}
                  </span>
                </div>
                <div class="search-item-meta">
                  <span class="search-item-date">{{ formatDate(task.listId) }}</span>
                  <span v-if="task.time" class="search-item-time">
                    <i class="bi-clock"></i>
                    {{ formatTime(task.time) }}
                  </span>
                  <span v-if="task.alarm" class="search-item-alarm">
                    <i class="bi-bell-fill"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 快捷键提示 -->
        <div class="search-footer" v-if="!searchQuery">
          <div class="search-hint">
            <kbd>↑</kbd><kbd>↓</kbd> 导航
            <kbd>Enter</kbd> 打开
            <kbd>Esc</kbd> 关闭
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import moment from "moment";
import { Modal } from "bootstrap";

export default {
  name: "SearchModal",
  data() {
    return {
      isVisible: false,
      searchQuery: "",
      selectedIndex: 0,
      filteredTasks: []
    };
  },
  mounted() {
    // 监听全局快捷键
    document.addEventListener("keydown", this.handleGlobalKeydown);
  },
  beforeUnmount() {
    document.removeEventListener("keydown", this.handleGlobalKeydown);
  },
  methods: {
    handleGlobalKeydown(e) {
      // Cmd/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        this.openSearch();
      }
    },
    openSearch() {
      this.isVisible = true;
      this.searchQuery = "";
      this.filteredTasks = [];
      this.selectedIndex = 0;
      this.$nextTick(() => {
        this.$refs.searchInput?.focus();
      });
    },
    closeSearch() {
      this.isVisible = false;
      this.searchQuery = "";
      this.filteredTasks = [];
      this.selectedIndex = 0;
    },
    handleSearch() {
      if (!this.searchQuery.trim()) {
        this.filteredTasks = [];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      const allTasks = [];
      
      // 搜索所有待办列表
      const todoLists = this.$store.getters.todoLists;
      for (const [listId, tasks] of Object.entries(todoLists)) {
        if (Array.isArray(tasks)) {
          tasks.forEach((task, index) => {
            if (task.text && task.text.toLowerCase().includes(query)) {
              allTasks.push({
                ...task,
                listId,
                index
              });
            }
          });
        }
      }
      
      // 搜索自定义列表
      const customLists = this.$store.getters.cTodoListIds;
      customLists.forEach(customList => {
        const listId = customList.listId;
        const tasks = todoLists[listId];
        if (Array.isArray(tasks)) {
          tasks.forEach((task, index) => {
            if (task.text && task.text.toLowerCase().includes(query)) {
              allTasks.push({
                ...task,
                listId,
                listName: customList.listName,
                index
              });
            }
          });
        }
      });
      
      // 按日期排序（最近的在前）
      this.filteredTasks = allTasks.sort((a, b) => {
        const dateA = moment(a.listId, "YYYYMMDD");
        const dateB = moment(b.listId, "YYYYMMDD");
        return dateB.diff(dateA);
      }).slice(0, 50); // 限制50条结果
      
      this.selectedIndex = 0;
    },
    selectNext() {
      if (this.selectedIndex < this.filteredTasks.length - 1) {
        this.selectedIndex++;
        this.scrollToSelected();
      }
    },
    selectPrevious() {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
        this.scrollToSelected();
      }
    },
    scrollToSelected() {
      this.$nextTick(() => {
        const selected = document.querySelector(".search-item-selected");
        if (selected) {
          selected.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    },
    openSelectedTask() {
      if (this.filteredTasks.length > 0) {
        const task = this.filteredTasks[this.selectedIndex];
        this.openTask(task);
      }
    },
    openTask(task) {
      this.closeSearch();
      
      // 打开任务详情模态框
      const selectedTodo = {
        toDo: task,
        index: task.index,
        toDoListId: task.listId
      };
      
      this.$store.commit("selectTodo", selectedTodo);
      
      this.$nextTick(() => {
        const modal = new Modal(document.getElementById("toDoModal"));
        modal.show();
      });
    },
    formatDate(listId) {
      if (listId.length === 8) {
        const date = moment(listId, "YYYYMMDD");
        const today = moment();
        const tomorrow = moment().add(1, "d");
        
        if (date.isSame(today, "day")) {
          return this.$t("ui.today") || "今天";
        } else if (date.isSame(tomorrow, "day")) {
          return this.$t("ui.tomorrow") || "明天";
        } else {
          return date.format("MM/DD ddd");
        }
      }
      return listId;
    },
    formatTime(time) {
      if (time) {
        return moment(time, "HH:mm").format("HH:mm");
      }
      return "";
    }
  }
};
</script>

<style scoped lang="scss">
/* 搜索模态框遮罩 */
.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 1060;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  overflow-y: auto;
}

/* 搜索模态框 */
.search-modal {
  width: 90%;
  max-width: 600px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12),
              0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  
  :global(.dark-theme) & {
    background: rgba(28, 28, 30, 0.95);
  }
}

/* 搜索头部 */
.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.08);
  
  :global(.dark-theme) & {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}

.search-icon {
  font-size: 1.25rem;
  color: #8e8e93;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: #1c1c1e;
  outline: none;
  
  &::placeholder {
    color: #8e8e93;
  }
  
  :global(.dark-theme) & {
    color: #f5f5f7;
  }
}

.search-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  i {
    font-size: 1.25rem;
  }
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  :global(.dark-theme) & {
    background: rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

/* 搜索结果 */
.search-results {
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.search-empty {
  padding: 60px 20px;
  text-align: center;
  color: #8e8e93;
  
  i {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 0.9375rem;
  }
}

.search-list {
  padding: 8px;
}

.search-item {
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 4px;
  
  &:hover,
  &.search-item-selected {
    background: rgba(0, 122, 255, 0.08);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  :global(.dark-theme) & {
    &:hover,
    &.search-item-selected {
      background: rgba(10, 132, 255, 0.15);
    }
  }
}

.search-item-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.search-item-text {
  font-size: 0.9375rem;
  color: #1c1c1e;
  flex: 1;
  
  &.completed {
    color: #8e8e93;
    text-decoration: line-through;
  }
  
  :global(.dark-theme) & {
    color: #f5f5f7;
    
    &.completed {
      color: #636366;
    }
  }
}

.search-item-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8125rem;
  color: #8e8e93;
  padding-left: 24px;
}

.search-item-date {
  font-weight: 500;
}

.search-item-time,
.search-item-alarm {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 搜索底部提示 */
.search-footer {
  padding: 12px 20px;
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  
  :global(.dark-theme) & {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.search-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: #8e8e93;
  
  kbd {
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 0.6875rem;
    
    :global(.dark-theme) & {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

/* 动画 */
.search-modal-enter-active,
.search-modal-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  .search-modal {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.search-modal-enter-from,
.search-modal-leave-to {
  opacity: 0;
  
  .search-modal {
    transform: scale(0.95) translateY(-20px);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .search-modal-overlay {
    padding-top: 5vh;
  }
  
  .search-modal {
    width: 95%;
    max-width: none;
    margin: 0 auto;
  }
  
  .search-results {
    max-height: 70vh;
  }
  
  .search-item {
    padding: 14px 12px;
  }
}
</style>
