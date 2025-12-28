<template>
  <div class="bottom-nav">
    <div class="nav-item" @click="setTodayDate" :title="$t('ui.today')">
      <i class="bi-house"></i>
      <span>{{ $t('ui.today') }}</span>
    </div>
    
    <div class="nav-item" @click="changeDate" :title="$t('ui.calendar')">
      <i class="bi-calendar-event"></i>
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
      data-bs-toggle="modal"
      data-bs-target="#configModal"
      :title="$t('settings.settings')"
      @click="openConfigModal"
    >
      <i class="bi-gear"></i>
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
    openConfigModal: function () {
      // 配置模态框打开逻辑
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
.bottom-nav {
  display: none; /* 默认隐藏 */
}

/* 移动端显示底部导航 */
@media (max-width: 768px) {
  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background-color: #ffffff;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1000;
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
.dark-theme {
  @media (max-width: 768px) {
    .bottom-nav {
      background-color: #161b22;
      border-top-color: #30363d;
    }
    
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
