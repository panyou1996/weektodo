<template>
  <div class="bottom-nav">
    <div class="nav-item" @click="setTodayDate" :class="{ active: isToday }" :title="$t('ui.today')">
      <i class="bi-house-fill"></i>
      <span>{{ $t('ui.today') }}</span>
    </div>
    
    <div class="nav-item" @click="openDatePicker" :title="$t('ui.calendar')">
      <i class="bi-calendar3"></i>
      <span>{{ $t('ui.calendar') }}</span>
    </div>
    
    <div 
      class="nav-item" 
      :title="$t('ui.recurringTasks')"
      data-bs-toggle="modal"
      data-bs-target="#RecurrentEventsModal"
    >
      <i class="bi-arrow-repeat"></i>
      <span>{{ $t('ui.recurring') }}</span>
    </div>
    
    <div 
      class="nav-item"
      :title="$t('ui.newCustomList')"
      @click="addCustomList"
    >
      <i class="bi-plus-circle"></i>
      <span>{{ $t('ui.add') }}</span>
    </div>
    
    <div 
      class="nav-item"
      data-bs-toggle="modal"
      data-bs-target="#configModal"
      :title="$t('settings.settings')"
    >
      <i class="bi-gear-fill"></i>
      <span>{{ $t('settings.settings') }}</span>
    </div>
    
    <!-- 隐藏的日期选择器 -->
    <input
      ref="datepickerInput"
      type="date"
      class="hidden-datepicker"
      @change="onDateChange"
    />
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "bottomNav",
  emits: ["changeDate"],
  data() {
    return {
      isToday: true,
    };
  },
  methods: {
    setTodayDate() {
      this.isToday = true;
      this.$emit("changeDate", moment().format("YYYYMMDD"));
    },
    openDatePicker() {
      // 触发隐藏的 input[type=date]
      this.$refs.datepickerInput.showPicker();
    },
    onDateChange(event) {
      const selectedDate = event.target.value;
      if (selectedDate) {
        this.isToday = false;
        this.$emit("changeDate", moment(selectedDate).format("YYYYMMDD"));
      }
    },
    addCustomList() {
      const listName = prompt(this.$t('ui.newCustomList'));
      if (listName && listName.trim()) {
        this.$store.dispatch("addCTodoListId", listName.trim());
      }
    },
  },
};
</script>

<style scoped lang="scss">
/* 隐藏的日期选择器 */
.hidden-datepicker {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

/* 桌面端隐藏 */
.bottom-nav {
  display: none;
}

/* 移动端显示 - iOS 16 风格底部导航栏 */
@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 0.5px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0 -0.5px 0 0 rgba(0, 0, 0, 0.04);
    z-index: 1050;
    padding-bottom: env(safe-area-inset-bottom);
    
    /* iOS 弹性效果 - 优化动画 */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    will-change: transform;
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    padding: 4px 0;
    
    /* iOS 点击反馈 */
    -webkit-tap-highlight-color: transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    i {
      font-size: 1.4rem;
      margin-bottom: 2px;
      color: #8e8e93;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    span {
      font-size: 0.625rem;
      font-weight: 500;
      color: #8e8e93;
      letter-spacing: -0.08px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* 活跃状态 */
    &.active {
      i {
        color: #007aff;
        transform: scale(1.05);
      }
      
      span {
        color: #007aff;
      }
    }
    
    /* 点击效果 */
    &:active {
      transform: scale(0.95);
      
      i {
        transform: scale(0.9);
      }
    }
  }
}

/* 暗色主题 - iOS 16 风格 */
@media (max-width: 768px) {
  :global(.dark-theme) .bottom-nav {
    background: rgba(28, 28, 30, 0.8);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 -0.5px 0 0 rgba(255, 255, 255, 0.06);
    
    .nav-item {
      i, span {
        color: #98989d;
      }
      
      &.active {
        i {
          color: #0a84ff;
        }
        
        span {
          color: #0a84ff;
        }
      }
    }
  }
}
</style>
