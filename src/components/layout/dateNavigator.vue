<template>
  <div class="date-navigator">
    <!-- 日期导航条 -->
    <div v-if="showCalendar" class="navigator-scroll-container" ref="dateScrollContainer">
      <div class="navigator-items">
        <div
          v-for="date in datesList"
          :key="date.id"
          class="nav-date-item"
          :class="{ 'active': isActiveDate(date.id) }"
          @click="selectDate(date.id)"
        >
          <div class="nav-date-day">{{ date.day }}</div>
          <div class="nav-date-label">{{ date.label }}</div>
        </div>
      </div>
    </div>
    
    <!-- 自定义列表导航条 -->
    <div v-if="showCustomList" class="navigator-scroll-container custom-list-nav" ref="listScrollContainer">
      <div class="navigator-items">
        <div
          v-for="list in customLists"
          :key="list.listId"
          class="nav-list-item"
          :class="{ 'active': isActiveList(list.listId) }"
          @click="selectList(list.listId)"
        >
          <i class="bi-list-ul"></i>
          <span>{{ list.listName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "DateNavigator",
  props: {
    currentDate: {
      type: String,
      default: ""
    },
    currentListId: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      datesList: [],
      vibrationSupported: false
    };
  },
  computed: {
    showCalendar() {
      return this.$store.getters.config.calendar;
    },
    showCustomList() {
      return this.$store.getters.config.customList;
    },
    customLists() {
      return this.$store.getters.cTodoListIds;
    }
  },
  mounted() {
    this.generateDatesList();
    this.checkVibrationSupport();
    this.scrollToActive();
  },
  watch: {
    currentDate() {
      this.scrollToActive();
    }
  },
  methods: {
    generateDatesList() {
      const dates = [];
      
      // 生成前7天到后14天的日期
      for (let i = -7; i <= 14; i++) {
        const date = moment().add(i, "days");
        const dateId = date.format("YYYYMMDD");
        
        let label = date.format("ddd");
        if (i === 0) {
          label = "Today";
        } else if (i === 1) {
          label = "Tmr";  // Tomorrow 缩写
        } else if (i === -1) {
          label = "Yst";  // Yesterday 缩写
        }
        
        dates.push({
          id: dateId,
          day: date.format("D"),
          label: label,
          weekday: date.format("ddd"),
          isToday: i === 0,
          isTomorrow: i === 1,
          isYesterday: i === -1
        });
      }
      
      this.datesList = dates;
    },
    checkVibrationSupport() {
      this.vibrationSupported = "vibrate" in navigator;
    },
    vibrate(pattern = 10) {
      if (this.vibrationSupported) {
        try {
          navigator.vibrate(pattern);
        } catch (e) {
          // Vibration not supported or failed
        }
      }
    },
    isActiveDate(dateId) {
      return this.currentDate === dateId;
    },
    isActiveList(listId) {
      return this.currentListId === listId;
    },
    selectDate(dateId) {
      if (this.currentDate !== dateId) {
        this.vibrate(10); // 轻微震动反馈
        this.$emit("date-selected", dateId);
        this.$nextTick(() => {
          this.scrollToActive();
        });
      }
    },
    selectList(listId) {
      if (this.currentListId !== listId) {
        this.vibrate(10); // 轻微震动反馈
        this.$emit("list-selected", listId);
        this.$nextTick(() => {
          this.scrollToActive();
        });
      }
    },
    scrollToActive() {
      this.$nextTick(() => {
        // 滚动日期导航条
        const dateContainer = this.$refs.dateScrollContainer;
        if (dateContainer) {
          const activeItem = dateContainer.querySelector(".active");
          if (activeItem) {
            this.scrollItemToCenter(dateContainer, activeItem);
          }
        }
        
        // 滚动列表导航条
        const listContainer = this.$refs.listScrollContainer;
        if (listContainer) {
          const activeItem = listContainer.querySelector(".active");
          if (activeItem) {
            this.scrollItemToCenter(listContainer, activeItem);
          }
        }
      });
    },
    scrollItemToCenter(container, item) {
      const containerWidth = container.offsetWidth;
      const itemLeft = item.offsetLeft;
      const itemWidth = item.offsetWidth;
      
      // 计算滚动位置，使选中项居中
      const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth"
      });
    }
  }
};
</script>

<style scoped lang="scss">
/* 桌面端隐藏 */
.date-navigator {
  display: none;
}

/* 移动端显示 */
@media (max-width: 768px) {
  .date-navigator {
    display: flex;
    flex-direction: column-reverse;  /* 列表在上，日期在下 */
    position: fixed;
    bottom: 50px; /* 在底部导航栏上方 */
    left: 0;
    right: 0;
    z-index: 1049;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .navigator-scroll-container {
    height: 60px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 0.5px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari */
    }
  }
  
  /* 自定义列表导航样式差异 */
  .custom-list-nav {
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
    border-top: none;
  }
  
  .navigator-items {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    gap: 8px;
    min-width: min-content;
  }
  
  /* 日期项样式 */
  .nav-date-item {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 52px;
    height: 48px;
    padding: 4px 8px;
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      background: #007aff;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
      
      .nav-date-day,
      .nav-date-label {
        color: white;
        font-weight: 600;
      }
    }
    
    &:not(.active):active {
      background: rgba(0, 0, 0, 0.05);
    }
  }
  
  .nav-date-day {
    font-size: 1.125rem;
    font-weight: 500;
    color: #1c1c1e;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  
  .nav-date-label {
    font-size: 0.6875rem;
    font-weight: 400;
    color: #8e8e93;
    line-height: 1;
    margin-top: 2px;
    letter-spacing: -0.01em;
  }
  
  /* 自定义列表项样式 */
  .nav-list-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    white-space: nowrap;
    
    i {
      font-size: 1rem;
      color: #8e8e93;
    }
    
    span {
      font-size: 0.875rem;
      color: #1c1c1e;
      font-weight: 500;
      letter-spacing: -0.02em;
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      background: #007aff;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
      
      i,
      span {
        color: white;
      }
    }
    
    &:not(.active):active {
      background: rgba(0, 0, 0, 0.05);
    }
  }
  
  /* 暗色主题 */
  :global(.dark-theme) .navigator-scroll-container {
    background: rgba(28, 28, 30, 0.95);
    border-top-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
  }
  
  :global(.dark-theme) .custom-list-nav {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
  
  :global(.dark-theme) .nav-date-item {
    .nav-date-day {
      color: #f5f5f7;
    }
    
    .nav-date-label {
      color: #98989d;
    }
    
    &.active {
      background: #0a84ff;
      
      .nav-date-day,
      .nav-date-label {
        color: white;
      }
    }
    
    &:not(.active):active {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  :global(.dark-theme) .nav-list-item {
    i {
      color: #98989d;
    }
    
    span {
      color: #f5f5f7;
    }
    
    &.active {
      background: #0a84ff;
      
      i,
      span {
        color: white;
      }
    }
    
    &:not(.active):active {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

/* 滚动指示器（可选） */
@media (max-width: 768px) {
  .navigator-scroll-container::before,
  .navigator-scroll-container::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 20px;
    pointer-events: none;
    z-index: 1;
  }
  
  .navigator-scroll-container::before {
    left: 0;
    background: linear-gradient(to right, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0) 100%);
  }
  
  .navigator-scroll-container::after {
    right: 0;
    background: linear-gradient(to left, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0) 100%);
  }
  
  :global(.dark-theme) .navigator-scroll-container::before {
    background: linear-gradient(to right, 
      rgba(28, 28, 30, 0.95) 0%, 
      rgba(28, 28, 30, 0) 100%);
  }
  
  :global(.dark-theme) .navigator-scroll-container::after {
    background: linear-gradient(to left, 
      rgba(28, 28, 30, 0.95) 0%, 
      rgba(28, 28, 30, 0) 100%);
  }
}
</style>
