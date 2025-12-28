<template>
  <div class="bottom-nav">
    <div class="nav-item" @click="setTodayDate" :title="$t('ui.today')">
      <i class="bi-house-fill"></i>
      <span>{{ $t('ui.today') }}</span>
    </div>
    
    <div class="nav-item" @click="changeDate" :title="$t('ui.calendar')">
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
    
    <datepicker
      v-if="datepickerEnabled"
      id="bottom-nav-date-picker"
      v-model="pickedDate"
      :locale="language"
      :weekStartsOn="weekStartOnMonday"
      style="display: none;"
    />
  </div>
</template>

<script>
import moment from "moment";
import Datepicker from "vue3-datepicker";
import languageHelper from "../../helpers/languageHelper.js";

export default {
  name: "bottomNav",
  emits: ["changeDate"],
  components: {
    Datepicker,
  },
  data() {
    return {
      datepickerEnabled: true,
      pickedDate: new Date(),
    };
  },
  methods: {
    setTodayDate: function () {
      this.$emit("changeDate", moment().format("YYYYMMDD"));
    },
    changeDate: function () {
      document.getElementById("bottom-nav-date-picker").click();
    },
    addCustomList: function () {
      const listName = prompt(this.$t('ui.newCustomList'));
      if (listName && listName.trim()) {
        this.$store.dispatch("addCTodoListId", listName.trim());
      }
    },
  },
  computed: {
    language: function () {
      return languageHelper.getLanguage(this.$store.getters.config.language);
    },
    weekStartOnMonday: function () {
      return this.$store.getters.config.weekStartOnMonday ? 1 : 0;
    },
  },
  watch: {
    pickedDate: function (newDate) {
      this.$emit("changeDate", moment(newDate).format("YYYYMMDD"));
    },
  },
};
</script>

<style scoped lang="scss">
/* 默认桌面端隐藏 */
.bottom-nav {
  display: none;
}

/* 移动端显示底部导航 */
@media (max-width: 768px) {
  .bottom-nav {
    display: flex !important;  /* 强制显示 */
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 60px;
    background-color: #ffffff;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1050;  /* 高于大部分元素，但低于模态框 */
    padding-bottom: env(safe-area-inset-bottom); /* iOS 安全区域 */
  }
  
  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    
    i {
      font-size: 1.4rem;
      margin-bottom: 2px;
      color: #666;
    }
    
    span {
      font-size: 0.7rem;
      color: #666;
    }
    
    &:active {
      background-color: #f5f5f5;
    }
    
    &:hover {
      i, span {
        color: #000;
      }
    }
  }
}

/* 暗色主题 */
@media (max-width: 768px) {
  :global(.dark-theme) .bottom-nav {
    background-color: #161b22;
    border-top-color: #30363d;
    
    .nav-item {
      i, span {
        color: #c9d1d9;
      }
      
      &:active {
        background-color: #21262d;
      }
      
      &:hover {
        i, span {
          color: #ffffff;
        }
      }
    }
  }
}
</style>
