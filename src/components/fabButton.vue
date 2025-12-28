<template>
  <div class="fab-container" v-show="showFab">
    <!-- 展开的菜单项 -->
    <transition-group name="fab-menu" tag="div" class="fab-menu">
      <div
        v-for="(item, index) in menuItems"
        :key="item.id"
        v-show="isExpanded"
        class="fab-menu-item"
        :style="{ transitionDelay: `${index * 0.05}s` }"
        @click="handleMenuClick(item)"
      >
        <div class="fab-menu-label">{{ item.label }}</div>
        <div class="fab-menu-button">
          <i :class="item.icon"></i>
        </div>
      </div>
    </transition-group>
    
    <!-- 主按钮 -->
    <button 
      class="fab-button" 
      :class="{ 'fab-expanded': isExpanded }"
      @click="toggleExpand"
    >
      <i :class="isExpanded ? 'bi-x' : 'bi-plus'"></i>
    </button>
  </div>
</template>

<script>
import moment from "moment";
import { Modal } from "bootstrap";

export default {
  name: "FabButton",
  data() {
    return {
      isExpanded: false,
      showFab: true,
      menuItems: [
        {
          id: "add-today",
          label: this.$t("ui.today"),
          icon: "bi-calendar-check",
          action: "addToday"
        },
        {
          id: "add-tomorrow",
          label: this.$t("ui.tomorrow"),
          icon: "bi-calendar-plus",
          action: "addTomorrow"
        },
        {
          id: "add-custom-list",
          label: this.$t("ui.newCustomList"),
          icon: "bi-list-ul",
          action: "addCustomList"
        },
        {
          id: "add-recurring",
          label: this.$t("ui.recurring"),
          icon: "bi-arrow-repeat",
          action: "addRecurring"
        }
      ]
    };
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    handleMenuClick(item) {
      this.isExpanded = false;
      
      switch (item.action) {
        case "addToday":
          this.addTaskToDate(moment().format("YYYYMMDD"));
          break;
        case "addTomorrow":
          this.addTaskToDate(moment().add(1, "d").format("YYYYMMDD"));
          break;
        case "addCustomList":
          this.addCustomList();
          break;
        case "addRecurring":
          this.openRecurringModal();
          break;
      }
    },
    addTaskToDate(date) {
      this.$emit("changeDate", date);
      this.$nextTick(() => {
        const listElement = document.getElementById("list" + date);
        if (listElement) {
          const input = listElement.querySelector(".new-todo-input");
          if (input) {
            input.focus();
          }
        }
      });
    },
    addCustomList() {
      const listName = prompt(this.$t("ui.newCustomList"));
      if (listName && listName.trim()) {
        this.$store.dispatch("addCTodoListId", listName.trim());
      }
    },
    openRecurringModal() {
      const modal = new Modal(document.getElementById("RecurrentEventsModal"));
      modal.show();
    }
  }
};
</script>

<style scoped lang="scss">
/* 桌面端隐藏 */
.fab-container {
  display: none;
}

/* 移动端显示 */
@media (max-width: 768px) {
  .fab-container {
    display: block;
    position: fixed;
    right: 20px;
    bottom: 80px;
    z-index: 1040;
  }
  
  /* 主按钮 */
  .fab-button {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #007aff 0%, #0051d5 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4),
                0 2px 8px rgba(0, 122, 255, 0.2);
    color: white;
    font-size: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    
    i {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    &.fab-expanded {
      background: linear-gradient(135deg, #ff3b30 0%, #d32f2f 100%);
      box-shadow: 0 4px 16px rgba(255, 59, 48, 0.4),
                  0 2px 8px rgba(255, 59, 48, 0.2);
      
      i {
        transform: rotate(90deg);
      }
    }
    
    &:active {
      transform: scale(0.92);
    }
  }
  
  /* 菜单容器 */
  .fab-menu {
    position: absolute;
    bottom: 70px;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  /* 菜单项 */
  .fab-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    
    .fab-menu-label {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      color: #1c1c1e;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12),
                  0 1px 4px rgba(0, 0, 0, 0.08);
      letter-spacing: -0.02em;
    }
    
    .fab-menu-button {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12),
                  0 1px 4px rgba(0, 0, 0, 0.08);
      
      i {
        font-size: 1.25rem;
        color: #007aff;
      }
    }
    
    &:active {
      .fab-menu-button {
        transform: scale(0.92);
      }
    }
  }
  
  /* 进入/离开动画 */
  .fab-menu-enter-active,
  .fab-menu-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fab-menu-enter-from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  
  .fab-menu-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  
  /* 暗色主题 */
  :global(.dark-theme) .fab-menu-item {
    .fab-menu-label {
      background: rgba(28, 28, 30, 0.95);
      color: #f5f5f7;
    }
    
    .fab-menu-button {
      background: #2c2c2e;
      
      i {
        color: #0a84ff;
      }
    }
  }
}
</style>
