<template>
  <div class="anydo-view">
    <!-- 顶部导航 -->
    <div class="anydo-header">
      <i class="bi-list menu-icon" @click="toggleSidebar"></i>
      <h1 class="header-title">ALL TASKS</h1>
      <i class="bi-three-dots more-icon" @click="showMore"></i>
    </div>

    <!-- 任务列表容器 -->
    <div class="anydo-content">
      <!-- Today 分组 -->
      <div v-if="todayTasks.length > 0" class="task-group">
        <div class="group-header">
          <h2 class="group-title">Today</h2>
          <i class="bi-plus-lg add-icon" @click="addTask('today')"></i>
        </div>
        <div class="task-list">
          <anydo-task-item
            v-for="(task, index) in todayTasks"
            :key="task.id || index"
            :task="task"
            :list-id="todayDate"
            :index="index"
            @task-click="handleTaskClick"
          />
        </div>
      </div>

      <!-- Tomorrow 分组 -->
      <div v-if="tomorrowTasks.length > 0" class="task-group">
        <div class="group-header">
          <h2 class="group-title">Tomorrow</h2>
          <i class="bi-plus-lg add-icon" @click="addTask('tomorrow')"></i>
        </div>
        <div class="task-list">
          <anydo-task-item
            v-for="(task, index) in tomorrowTasks"
            :key="task.id || index"
            :task="task"
            :list-id="tomorrowDate"
            :index="index"
            @task-click="handleTaskClick"
          />
        </div>
      </div>

      <!-- Upcoming 分组 -->
      <div v-if="upcomingTasks.length > 0" class="task-group">
        <div class="group-header">
          <h2 class="group-title">Upcoming</h2>
          <i class="bi-plus-lg add-icon" @click="addTask('upcoming')"></i>
        </div>
        <div class="task-list">
          <anydo-task-item
            v-for="(task, index) in upcomingTasks"
            :key="task.id || index"
            :task="task"
            :list-id="task.listId"
            :index="index"
            @task-click="handleTaskClick"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="allTasksCount === 0" class="empty-state">
        <i class="bi-check2-circle"></i>
        <p>No tasks yet</p>
        <span>Tap + to add a new task</span>
      </div>
    </div>

    <!-- 底部快速输入 -->
    <div class="quick-add-bar">
      <i class="bi-house home-icon"></i>
      <input
        ref="quickInput"
        type="text"
        class="quick-input"
        placeholder="I want to..."
        v-model="quickTaskText"
        @keyup.enter="quickAddTask"
      />
    </div>
  </div>
</template>

<script>
import moment from "moment";
import AnydoTaskItem from "./AnyDoTaskItem.vue";

export default {
  name: "AnyDoView",
  components: {
    AnydoTaskItem
  },
  data() {
    return {
      quickTaskText: ""
    };
  },
  computed: {
    todayDate() {
      return moment().format("YYYYMMDD");
    },
    tomorrowDate() {
      return moment().add(1, "day").format("YYYYMMDD");
    },
    todayTasks() {
      const tasks = this.$store.getters.todoLists[this.todayDate];
      return Array.isArray(tasks) ? tasks : [];
    },
    tomorrowTasks() {
      const tasks = this.$store.getters.todoLists[this.tomorrowDate];
      return Array.isArray(tasks) ? tasks : [];
    },
    upcomingTasks() {
      const allLists = this.$store.getters.todoLists;
      const upcoming = [];
      const afterTomorrow = moment().add(2, "days").format("YYYYMMDD");
      
      for (const [dateId, tasks] of Object.entries(allLists)) {
        if (dateId >= afterTomorrow && Array.isArray(tasks)) {
          tasks.forEach((task, index) => {
            upcoming.push({
              ...task,
              listId: dateId,
              index
            });
          });
        }
      }
      
      return upcoming;
    },
    allTasksCount() {
      return this.todayTasks.length + this.tomorrowTasks.length + this.upcomingTasks.length;
    }
  },
  methods: {
    toggleSidebar() {
      this.$emit("toggle-sidebar");
    },
    showMore() {
      // 显示更多选项菜单
    },
    addTask(section) {
      let dateId = this.todayDate;
      if (section === "tomorrow") {
        dateId = this.tomorrowDate;
      }
      this.$emit("add-task", dateId);
    },
    quickAddTask() {
      if (this.quickTaskText.trim()) {
        this.$store.commit("addTodo", {
          toDoListId: this.todayDate,
          text: this.quickTaskText.trim()
        });
        this.quickTaskText = "";
      }
    },
    handleTaskClick(task) {
      this.$emit("task-click", task);
    }
  }
};
</script>

<style scoped lang="scss">
.anydo-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
}

/* 顶部导航 */
.anydo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .menu-icon,
  .more-icon {
    font-size: 24px;
    color: #1a1a1a;
    cursor: pointer;
    padding: 8px;
    
    &:active {
      opacity: 0.6;
    }
  }
  
  .header-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin: 0;
    color: #1a1a1a;
  }
  
  :global(.dark-theme) & {
    background: #1c1c1e;
    border-bottom-color: rgba(255, 255, 255, 0.1);
    
    .menu-icon,
    .more-icon,
    .header-title {
      color: #f5f5f7;
    }
  }
}

/* 内容区域 */
.anydo-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 80px;
}

/* 任务分组 */
.task-group {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 20px 12px;
  
  .group-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
    
    :global(.dark-theme) & {
      color: #f5f5f7;
    }
  }
  
  .add-icon {
    font-size: 20px;
    color: #4A9EFF;
    cursor: pointer;
    padding: 8px;
    
    &:active {
      opacity: 0.6;
    }
  }
}

.task-list {
  background: #ffffff;
  
  :global(.dark-theme) & {
    background: #1c1c1e;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #999;
  
  i {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  
  p {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: #666;
  }
  
  span {
    font-size: 14px;
    color: #999;
  }
  
  :global(.dark-theme) & {
    p {
      color: #8e8e93;
    }
    
    span {
      color: #636366;
    }
  }
}

/* 底部快速输入 */
.quick-add-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
  
  .home-icon {
    font-size: 24px;
    color: #4A9EFF;
    flex-shrink: 0;
  }
  
  .quick-input {
    flex: 1;
    border: none;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 20px;
    padding: 10px 16px;
    font-size: 16px;
    color: #1a1a1a;
    outline: none;
    
    &::placeholder {
      color: #999;
    }
    
    &:focus {
      background: rgba(0, 0, 0, 0.05);
    }
  }
  
  :global(.dark-theme) & {
    background: #1c1c1e;
    border-top-color: rgba(255, 255, 255, 0.1);
    
    .quick-input {
      background: rgba(255, 255, 255, 0.1);
      color: #f5f5f7;
      
      &::placeholder {
        color: #636366;
      }
      
      &:focus {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .anydo-view {
    height: 100dvh; /* 使用动态视口高度 */
  }
}
</style>
