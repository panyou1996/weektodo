<template>
  <input class="hidden-input-for-focus" type="text" />
  <div v-show="compatible" id="app-container" class="app-container" :class="{ 'dark-theme': darkTheme }">
    <div class="app-body" :style="{ zoom: `${zoom}%` }">
      <splash-screen ref="splash"></splash-screen>
      <side-bar @change-date="setSelectedDate"></side-bar>

      <div class="h-100 d-flex flex-column">
        <div
          v-show="showCalendar"
          class="todo-lists-container"
          :style="resizableStyle"
          ref="calendarContainer"
          :class="{
            'full-screen': !showCustomList,
            'hidden-lists-container': hideTopListContainer,
            'full-screen-divider': hideBottomListContainer,
          }"
        >
          <i class="bi-chevron-left slider-btn" ref="weekLeft" @click="weekMoveLeft"></i>
          <div class="todo-slider weekdays" ref="weekListContainer">
            <to-do-list
              v-for="date in dates_array"
              :key="date"
              :id="date"
              :showCustomList="showCustomList"
              @todo-list-mounted="todoListMounted"
            >
            </to-do-list>
          </div>
          <i class="bi-chevron-right slider-btn" ref="weekRight" @click="weekMoveRight"></i>
        </div>

        <div
          v-show="showCustomList && showCalendar"
          class="main-horizontal-divider"
          id="resizer"
          :class="mainDividerPositionClass"
          @mousedown="resizerMouseDownHandler"
          @dblclick="resizerDblClick"
        >
          <div class="inner-main-horizontal-divider"></div>
          <div class="divider-icons-container">
            <i
              class="bi-chevron-up move-to-center-up divider-icons"
              @click="setDividerPosition(1)"
              :title="$t('ui.restorePanel')"
            ></i>
            <i
              class="bi-chevron-up move-to-corner-up divider-icons"
              @click="setDividerPosition(2)"
              :title="$t('ui.maximizeListPanel')"
            ></i>
            <i
              class="bi-chevron-down move-to-center-down divider-icons"
              @click="setDividerPosition(1)"
              :title="$t('ui.restorePanel')"
            ></i>
            <i
              class="bi-chevron-down move-to-corner-down divider-icons"
              @click="setDividerPosition(0)"
              :title="$t('ui.maximizeCalendarPanel')"
            ></i>
          </div>
        </div>

        <div
          v-show="showCustomList"
          class="todo-lists-container"
          :class="{
            'full-screen': !showCalendar,
            'flex-grow-1': showCalendar,
            'hidden-lists-container': hideBottomListContainer,
          }"
        >
          <i
            class="bi-chevron-left slider-btn"
            @click="customMoveLeft"
            :style="{
              visibility: cTodoList.length > customColumns ? 'visible' : 'hidden',
            }"
          ></i>
          <div class="todo-slider slides" ref="customListContainer">
            <to-do-list
              v-for="(cTodoList, index) in cTodoList"
              :key="cTodoList.listId"
              :id="cTodoList.listId"
              :customTodoList="true"
              :cTodoListIndex="index"
              :showCustomList="showCustomList"
              @todo-list-mounted="todoListMounted"
            ></to-do-list>
          </div>
          <i
            class="bi-chevron-right slider-btn"
            @click="customMoveRight"
            :style="{
              visibility: cTodoList.length > customColumns ? 'visible' : 'hidden',
            }"
          ></i>
        </div>

        <div v-show="!showCustomList && !showCalendar" style="margin: auto">
          <img v-if="darkTheme" src="img/WeekToDoDarkLogo.webp" />
          <img v-else src="img/WeekToDoLightLogo.webp" />
        </div>
      </div>

      <remove-custom-list></remove-custom-list>
      <config-modal @change-columns="weekResetScroll" :configProp="$store.getters.config"></config-modal>
      <clear-data-modal></clear-data-modal>
      <clear-list-modal></clear-list-modal>
      <about-modal></about-modal>
      <donate-modal></donate-modal>
      <welcome-modal></welcome-modal>
      <tips-modal></tips-modal>
      <to-do-modal :selectedTodo="selectedTodo"></to-do-modal>
      <active-to-do :activeTodo="activeTodo"> </active-to-do>
      <recurrent-events-modal></recurrent-events-modal>
      <importing-modal :id="'importingModal'" :text="$t('settings.importing')"></importing-modal>
      <importing-modal :id="'exportingModal'" :text="$t('settings.exporting')"></importing-modal>

      <reorder-custom-lists-modal @reset-custom-list="resetCustomList"></reorder-custom-lists-modal>
    </div>
    
    <!-- 移动端底部导航栏 -->
    <bottom-nav @change-date="setSelectedDate"></bottom-nav>
    
    <!-- 移动端快速添加浮动按钮 -->
    <fab-button @change-date="setSelectedDate"></fab-button>
    
    <!-- 搜索模态框 -->
    <search-modal></search-modal>

    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1056">
      <toast-message
        id="versionChanges"
        :text="$t('ui.softwareUpdated')"
        :sub-text="$t('ui.seeChanges')"
        @subTextClick="seeChangeLog"
      ></toast-message>

      <toast-message
        id="newVersionAvailable"
        :text="$t('ui.newVersionAvailable')"
        :sub-text="$t('ui.download')"
        @subTextClick="downloadNewVersion"
      ></toast-message>

      <toast-message id="copiedAddress" :text="$t('donate.copiedAddres')"></toast-message>
    </div>
  </div>
  <div v-if="!compatible" class="compatible d-flex flex-column justify-content-center align-items-center p-5">
    <i class="bi-exclamation-diamond mb-4" style="font-size: 100px"></i>
    <h3 style="text-align: center">{{ $t("ui.compatible") }}</h3>
  </div>
</template>

<script>
import toDoList from "./components/toDoList";
import moment from "moment";
import sideBar from "./components/layout/sideBar";
import bottomNav from "./components/layout/bottomNav";
import customToDoListIdsRepository from "./repositories/customToDoListIdsRepository";
import removeCustomList from "./components/comfirmModals/removeCustomList";
import configModal from "./views/configModal";
import splashScreen from "./components/splashScreen";
import configRepository from "./repositories/configRepository";
import aboutModal from "./views/aboutModal";
import donateModal from "./views/donateModal";
import welcomeModal from "./views/welcomeModal";
import toDoModal from "./views/toDoModal/toDoModal";
import tipsModal from "./views/tipsModal";
import { Modal, Toast } from "bootstrap";
import migrations from "./migrations/migrations";
import version_json from "../public/version.json";
import isElectron from "is-electron";
import taskHelper from "./helpers/tasksHelper";
import notifications from "./helpers/notifications";
import clearDataModal from "./components/comfirmModals/clearDataModal.vue";
import clearListModal from "./components/comfirmModals/clearListModal.vue";
import importingModal from "./views/importingModal.vue";
import RecurrentEventsModal from "./views/RecurrentEventsModal.vue";
import repeatingEventRepository from "./repositories/repeatingEventRepository";
import toDoListRepository from "./repositories/toDoListRepository";
import ReorderCustomListsModal from "./views/ReorderCustomListsModal.vue";
import toastMessage from "./components/toastMessage";
import activeToDo from "./components/activeToDo.vue";
import tasksHelper from "./helpers/tasksHelper";
import fabButton from "./components/fabButton.vue";
import searchModal from "./components/searchModal.vue";

export default {
  name: "App",
  components: {
    donateModal,
    configModal,
    toDoList,
    sideBar,
    bottomNav,
    removeCustomList,
    splashScreen,
    aboutModal,
    welcomeModal,
    tipsModal,
    toDoModal,
    clearDataModal,
    RecurrentEventsModal,
    importingModal,
    ReorderCustomListsModal,
    clearListModal,
    toastMessage,
    activeToDo,
    fabButton,
    searchModal,
  },
  data() {
    return {
      selected_date: null,
      cTodoList: this.$store.getters.cTodoListIds,
      calendarHeight: "calc(50% - 50px)",
      ipcRenderer: null,
      initialLoadCompleted: false,
      initialListToLoad: 0,
      initialListLoaded: 0,
      // 双指缩放相关
      initialPinchDistance: 0,
      currentScale: 1,
      isPinching: false,
      // 底部导航栏隐藏相关
      lastScrollTop: 0,
      scrollThreshold: 5,
      isNavVisible: true,
      // 滑动检测相关
      touchStartX: 0,
      isSwipeDetected: false,
    };
  },
  beforeCreate() {
    let config = configRepository.load();
    if (version_json.version != config.version) {
      migrations.migrate();
    }

    if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    this.$store.commit("loadCustomTodoListsIds", customToDoListIdsRepository.load());
    this.$store.commit("loadConfig", configRepository.load());
    this.$i18n.locale = this.$store.getters.config.language;

    this.$store.dispatch("loadAllRepeatingEvent").then(
      function () {
        let totalDaysCount = parseInt(this.$store.getters.config.columns) + 2;
        let totalCustomListCount = this.$store.getters.cTodoListIds.length;
        this.initialListToLoad = totalDaysCount + totalCustomListCount;
        this.deleteOldRepeatingEvents();
        this.selected_date = moment().format("YYYYMMDD");
        this.$nextTick(() => {
          this.weekResetScroll();
        });
        this.$store.commit("loadRepeatingEventDateCache", this.$store.getters.repeatingEventList);
      }.bind(this)
    );
  },
  mounted() {
    this.$refs.weekListContainer.scrollLeft = this.todoListWidth();
    this.calendarHeight = this.$store.getters.config.calendarHeight;
    window.addEventListener("resize", this.weekResetScroll);
    
    // 添加双指缩放事件监听
    this.initPinchZoom();
    
    // 添加滚动监听实现底部导航栏自动隐藏（已禁用）
    // this.initScrollListener();
    
    // 监听列表滑动，同步导航条
    this.initSwipeListener();
    
    // 监听滑动和点击，隐藏悬浮窗口
    this.initActiveToDoHideListener();
    
    document.onreadystatechange = () => {
      if (document.readyState == "complete") {
        setTimeout(this.hideSplash, 2000);
      }
    };

    if (isElectron()) {
      const { ipcRenderer } = require("electron");
      this.ipcRenderer = ipcRenderer;
      if (this.$store.getters.config.firstTimeOpen) this.ipcRenderer.send("show-current-window");
      this.ipcRenderer.send("match-open-on-startup", this.$store.getters.config.openOnStartup);
    }

    if (this.$store.getters.config.importing) {
      this.$store.commit("updateConfig", { val: false, key: "importing" });
      configRepository.update(this.$store.getters.config);
      if (isElectron()) {
        this.syncElectronConfig();
      }
    }

    this.resetAppOnDayChange();
  },
  methods: {
    weekMoveLeft: function () {
      this.selected_date = moment(this.selected_date).subtract(1, "d").format("YYYYMMDD");
      this.$refs.weekListContainer.scrollLeft = this.todoListWidth() * 2;
      this.$refs.weekListContainer.scroll({
        left: this.$refs.weekListContainer.scrollLeft - this.todoListWidth(),
        top: 0,
        behavior: "smooth",
      });
    },
    weekMoveRight: function () {
      this.selected_date = moment(this.selected_date).add(1, "d").format("YYYYMMDD");
      this.$refs.weekListContainer.scrollLeft = 0;
      this.$refs.weekListContainer.scroll({
        left: this.$refs.weekListContainer.scrollLeft + this.todoListWidth(),
        top: 0,
        behavior: "smooth",
      });
    },
    deleteOldRepeatingEvents: function () {
      for (const event of Object.entries(this.$store.getters.repeatingEventList)) {
        if (moment(event[1].end_date).isBefore(moment())) {
          repeatingEventRepository.remove(event[0]);
          this.$store.commit("removeRepeatingEvent", event[0]);
        }
      }
    },
    weekResetScroll: function () {
      this.$refs.weekListContainer.scrollLeft = this.todoListWidth();
    },
    customMoveRight: function () {
      this.$refs.customListContainer.scrollLeft =
        this.$refs.customListContainer.scrollLeft + this.customTodoListWidth() - 13;
    },
    customMoveLeft: function () {
      this.$refs.customListContainer.scrollLeft = this.$refs.customListContainer.scrollLeft - this.customTodoListWidth();
    },
    resetCustomList: function () {
      this.$nextTick(function () {
        this.$refs.customListContainer.scrollLeft = 0;
      });
    },
    todoListWidth: function () {
      return this.$refs.weekListContainer.clientWidth / this.columns;
    },
    customTodoListWidth: function () {
      return this.$refs.customListContainer.clientWidth / this.customColumns;
    },
    setSelectedDate: function (date) {
      this.selected_date = date;
      this.$nextTick(function () {
        document
          .getElementById("list" + date)
          .getElementsByClassName("new-todo-input")[0]
          .focus();
      });
    },
    isElectron: function () {
      let isElectron = require("is-electron");
      return isElectron();
    },
    hideSplash: function () {
      if (this.isElectron()) {
        if (this.ipcRenderer.sendSync("is-windows-visible")) {
          this.$refs.splash.hideSplash();
        }
      } else {
        this.$refs.splash.hideSplash();
      }
      this.checksOnLoadApp();
      if (this.$store.getters.config.firstTimeOpen) {
        this.showWelcomeModal();
      }
    },
    showWelcomeModal: function () {
      let modal = new Modal(document.getElementById("welcomeModal"), {
        backdrop: "static",
      });
      modal.show();
      this.$store.commit("updateConfig", { val: false, key: "firstTimeOpen" });
      configRepository.update(this.$store.getters.config);
    },
    compatible: function () {
      return window.IndexedDB;
    },
    resizerDblClick: function () {
      if (this.$store.getters.config.mainDividerPosition != 1) return;

      this.calendarHeight = "calc(50% - 50px)";
      this.$store.commit("updateConfig", {
        val: this.calendarHeight,
        key: "calendarHeight",
      });
      configRepository.update(this.$store.getters.config);
    },
    resizerMouseDownHandler: function (e) {
      if (this.$store.getters.config.mainDividerPosition != 1) return;

      this.resizerY = e.clientY - 50;
      document.addEventListener("mousemove", this.resizerMouseMoveHandler);
      document.addEventListener("mouseup", this.resizerMouseUpHandler);
    },
    resizerMouseMoveHandler: function (e) {
      this.calendarHeight = `${((e.clientY - 50) * 100) / this.zoom}px`;
    },
    resizerMouseUpHandler: function () {
      document.removeEventListener("mousemove", this.resizerMouseMoveHandler);
      document.removeEventListener("mouseup", this.resizerMouseUpHandler);
      this.$store.commit("updateConfig", {
        val: this.calendarHeight,
        key: "calendarHeight",
      });
      configRepository.update(this.$store.getters.config);
    },
    refreshTodayNotifications: function () {
      notifications.refreshDayNotifications(this, moment().format("YYYYMMDD"));
    },
    todoListMounted: function () {
      this.methodsAfterInitialLoad();
    },
    methodsAfterInitialLoad: function () {
      if (!this.initialLoadCompleted) {
        this.initialListLoaded++;
        if (this.initialListLoaded == this.initialListToLoad) {
          this.initialLoadCompleted = true;
          if (this.$store.getters.config.moveOldTasks) {
            this.moveOldTasksToToday().then(() => {
              this.refreshTodayNotifications();
              this.$store.commit("updateConfig", { val: moment().format("YYYYMMDD"), key: "lastDayOpened" });
              configRepository.update(this.$store.getters.config);
              if (isElectron()) this.showInitialNotification();
            });
          } else {
            this.refreshTodayNotifications();
            if (isElectron()) this.showInitialNotification();
            this.$store.commit("updateConfig", { val: moment().format("YYYYMMDD"), key: "lastDayOpened" });
            configRepository.update(this.$store.getters.config);
          }
        }
      }
    },
    showInitialNotification: function () {
      if (!(this.$store.getters.config.notificationOnStartup && !this.$store.getters.config.firstTimeOpen)) return;
      setTimeout(
        function () {
          new Notification("WeekToDo", {
            body: this.initialNotificationText(),
            icon: "/favicon.ico",
            silent: true,
          }).onclick = () => {
            this.ipcRenderer.send("show-current-window");
            setTimeout(() => {
              if (document.getElementById("splashScreen")) {
                document.getElementById("splashScreen").classList.add("hiddenSplashScreen");
              }
            }, 3000);
          };
          notifications.playNotificationSound(this.$store.getters.config.notificationSound);
        }.bind(this),
        2000
      );
    },
    initialNotificationText: function () {
      let yesterdayTasks = this.$store.getters.todoLists[moment().subtract(1, "d").format("YYYYMMDD")];
      let todayTasks = this.$store.getters.todoLists[moment().format("YYYYMMDD")];

      let yesterayPendingTasksCount = taskHelper.pendingTasksCount(yesterdayTasks);
      let todayPendingTasksCount = taskHelper.pendingTasksCount(todayTasks);

      if (yesterayPendingTasksCount == 0 && todayPendingTasksCount == 0) {
        return this.$t("notifications.noPendingTasksToday");
      } else if (yesterayPendingTasksCount == 0) {
        return this.$t("notifications.pendingTasksToday", [todayPendingTasksCount]);
      } else if (todayPendingTasksCount == 0) {
        return this.$t("notifications.pendingTasksYesterday", [yesterayPendingTasksCount]);
      } else {
        return this.$t("notifications.pendingTasksYesterdayAndToday", [yesterayPendingTasksCount, todayPendingTasksCount]);
      }
    },
    resetAppOnDayChange: function () {
      var x = new moment();
      var y = new moment().add(1, "d").startOf("date");
      var duration = moment.duration(y.diff(x)).asMilliseconds();

      setTimeout(
        function () {
          if (isElectron() && !this.ipcRenderer.sendSync("is-windows-visible")) {
            window.location.reload();
          }
          this.refreshTodayNotifications();
          this.resetAppOnDayChange();
        }.bind(this),
        duration
      );
    },
    moveOldTasksToToday: async function () {
      var promise = new Promise((resolve) => {
        var todayListId = moment().format("YYYYMMDD");
        let daysBefore = moment().diff(moment(this.$store.getters.config.lastDayOpened), "days");
        if (daysBefore == 0) daysBefore = 7;
        for (let i = 1; i <= daysBefore; i++) {
          let listId = moment().subtract(i, "d").format("YYYYMMDD");
          this.$store.dispatch("loadTodoLists", listId).then(() => {
            this.$store.commit("moveUndoneItems", { origenId: listId, destinyId: todayListId });
            toDoListRepository.update(listId, this.$store.getters.todoLists[listId]);
            if (this.$store.getters.config.autoReorderTasks) {
              toDoListRepository.update(
                todayListId,
                tasksHelper.reorderTasksList(this.$store.getters.todoLists[todayListId])
              );
            } else {
              toDoListRepository.update(todayListId, this.$store.getters.todoLists[todayListId]);
            }
            if (i == daysBefore) {
              resolve("done!");
            }
          });
        }
      });
      return promise;
    },
    setDividerPosition: function (position) {
      this.$nextTick(function () {
        document.getElementById("app-container").classList.add("scrolling");
        setTimeout(() => {
          document.getElementById("app-container").classList.remove("scrolling");
        }, 400);
        this.$store.commit("updateConfig", { val: position, key: "mainDividerPosition" });
        configRepository.update(this.$store.getters.config);
      });
    },
    checkVersion: function () {
      if (version_json.version != this.$store.getters.config.version) {
        this.$store.commit("updateConfig", { val: version_json.version, key: "version" });
        configRepository.update(this.$store.getters.config);
        var toast = new Toast(document.getElementById("versionChanges"));
        toast.show();
      }
    },
    checkForUpdates: function () {
      if (this.isElectron() && this.$store.getters.config.checkUpdates) {
        const axios = require("axios").default;
        axios
          .get("https://app.weektodo.me/version.json")
          .then((response) => this.showNewVersionToast(response))
          .catch((error) => console.log(error.message));
      }
    },
    checksOnLoadApp: function () {
      if (this.isElectron()) {
        require("electron").ipcRenderer.on("initial-checks", () => {
          this.checkVersion();
          this.checkForUpdates();
        });
      } else {
        this.checkVersion();
      }
    },
    showNewVersionToast: function (response) {
      if (response.data.version != version_json.version) {
        var toast = new Toast(document.getElementById("newVersionAvailable"));
        toast.show();
      }
    },
    downloadNewVersion: function () {
      let isElectron = require("is-electron");
      if (isElectron()) {
        require("electron").shell.openExternal("https://weektodo.me", "_blank");
      } else {
        window.open("https://weektodo.me", "_blank");
      }
    },
    seeChangeLog: function () {
      window.open("https://weektodo.me/changelog", "_blank");
    },
    syncElectronConfig: function () {
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("set-tray-context-menu-label", { open: this.$t("ui.open"), quit: this.$t("ui.quit") });
      ipcRenderer.send("set-open-on-startup", this.$store.getters.config.openOnStartup);
      ipcRenderer.send("set-run-in-background", this.$store.getters.config.runInBackground);
      ipcRenderer.send("set-dark-tray-icon", this.$store.getters.config.darkTrayIcon);
    },
    // 初始化双指缩放功能
    initPinchZoom: function () {
      const appContainer = document.getElementById("app-container");
      if (!appContainer) return;

      // 从 localStorage 加载保存的缩放比例
      const savedScale = localStorage.getItem("pinchZoomScale");
      if (savedScale) {
        this.currentScale = parseFloat(savedScale);
        this.applyScale(this.currentScale);
      }

      appContainer.addEventListener("touchstart", this.handleTouchStart, { passive: false });
      appContainer.addEventListener("touchmove", this.handleTouchMove, { passive: false });
      appContainer.addEventListener("touchend", this.handleTouchEnd, { passive: false });
    },
    handleTouchStart: function (e) {
      if (e.touches.length === 2) {
        this.isPinching = true;
        this.initialPinchDistance = this.getPinchDistance(e.touches);
        e.preventDefault();
      }
    },
    handleTouchMove: function (e) {
      if (this.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getPinchDistance(e.touches);
        const scaleChange = currentDistance / this.initialPinchDistance;
        
        // 计算新的缩放比例（限制在 0.7 到 1.5 之间）
        let newScale = this.currentScale * scaleChange;
        newScale = Math.max(0.7, Math.min(1.5, newScale));
        
        this.applyScale(newScale);
        this.initialPinchDistance = currentDistance;
        this.currentScale = newScale;
      }
    },
    handleTouchEnd: function (e) {
      if (e.touches.length < 2) {
        if (this.isPinching) {
          // 保存缩放比例到 localStorage
          localStorage.setItem("pinchZoomScale", this.currentScale.toString());
        }
        this.isPinching = false;
      }
    },
    getPinchDistance: function (touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    applyScale: function (scale) {
      const appBody = document.querySelector(".app-body");
      if (appBody) {
        // 使用 CSS 变量来调整字体大小和间距
        const baseFontSize = 16; // 默认字体大小
        const newFontSize = baseFontSize * scale;
        
        appBody.style.setProperty("--scale-factor", scale);
        document.documentElement.style.fontSize = `${newFontSize}px`;
      }
    },
    // 初始化滚动监听，实现底部导航栏动态隐藏
    initScrollListener: function () {
      if (window.innerWidth > 768) return; // 只在移动端生效
      
      const scrollContainers = [
        document.querySelector(".app-body"),
        ...document.querySelectorAll(".todo-slider"),
        ...document.querySelectorAll(".todo-lists-container")
      ];
      
      scrollContainers.forEach(container => {
        if (container) {
          container.addEventListener("scroll", this.handleScroll, { passive: true });
        }
      });
    },
    handleScroll: function (e) {
      const scrollTop = e.target.scrollTop || e.target.scrollLeft || 0;
      const scrollDiff = scrollTop - this.lastScrollTop;
      
      if (Math.abs(scrollDiff) < this.scrollThreshold) return;
      
      const bottomNav = document.querySelector(".bottom-nav");
      if (!bottomNav) return;
      
      if (scrollDiff > 0 && this.isNavVisible) {
        // 向下滚动，隐藏导航栏
        bottomNav.style.transform = "translateY(100%)";
        this.isNavVisible = false;
      } else if (scrollDiff < 0 && !this.isNavVisible) {
        // 向上滚动，显示导航栏
        bottomNav.style.transform = "translateY(0)";
        this.isNavVisible = true;
      }
      
      this.lastScrollTop = scrollTop;
    },
    // 初始化滑动监听，同步导航条
    initSwipeListener: function() {
      if (window.innerWidth > 768) return; // 只在移动端生效
      
      const weekContainer = this.$refs.weekListContainer;
      const customContainer = this.$refs.customListContainer;
      
      if (weekContainer) {
        weekContainer.addEventListener('scroll', this.handleWeekScroll, { passive: true });
      }
      
      if (customContainer) {
        customContainer.addEventListener('scroll', this.handleCustomScroll, { passive: true });
      }
    },
    handleWeekScroll: function() {
      const container = this.$refs.weekListContainer;
      if (!container) return;
      
      // 计算当前显示的日期
      const scrollLeft = container.scrollLeft;
      const itemWidth = this.todoListWidth();
      const index = Math.round(scrollLeft / itemWidth);
      
      // 获取对应的日期
      const dateArray = this.dates_array;
      if (dateArray && dateArray[index]) {
        const newDate = dateArray[index];
        if (newDate !== this.selected_date) {
          this.selected_date = newDate;
        }
      }
    },
    handleCustomScroll: function() {
      // 自定义列表滑动时，可以添加相应逻辑
      // 目前保持简单，不需要特别处理
    },
    // 初始化悬浮窗口隐藏监听
    initActiveToDoHideListener: function() {
      const weekContainer = this.$refs.weekListContainer;
      const customContainer = this.$refs.customListContainer;
      const activeTodoItem = document.getElementById('todo-item-active');
      
      if (!activeTodoItem) return;
      
      // 滑动时隐藏
      const hideOnScroll = () => {
        if (activeTodoItem) {
          activeTodoItem.style.display = 'none';
        }
      };
      
      if (weekContainer) {
        weekContainer.addEventListener('scroll', hideOnScroll, { passive: true });
      }
      
      if (customContainer) {
        customContainer.addEventListener('scroll', hideOnScroll, { passive: true });
      }
      
      // 点击其他区域时隐藏
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!activeTodoItem.contains(target) && !target.closest('.todo-item-container')) {
          activeTodoItem.style.display = 'none';
        }
      });
    },
  },
  computed: {
    dates_array: function () {
      if (!this.selected_date) return [];
      var dates_array = [moment(this.selected_date).subtract(1, "d").format("YYYYMMDD"), this.selected_date];

      for (let i = 1; i < this.columns; i++) {
        dates_array.push(moment(this.selected_date).add(i, "d").format("YYYYMMDD"));
      }

      if (this.$store.getters.config.startCalendarYesterday) {
        dates_array.unshift(moment(this.selected_date).subtract(2, "d").format("YYYYMMDD"));
      } else {
        dates_array.push(moment(this.selected_date).add(this.columns, "d").format("YYYYMMDD"));
      }

      this.$store.commit("updateSelectedDates", dates_array);
      return dates_array;
    },
    showCustomList: function () {
      return this.$store.getters.config.customList;
    },
    showCalendar: function () {
      return this.$store.getters.config.calendar;
    },
    columns: function () {
      return this.$store.getters.config.columns;
    },
    customColumns: function () {
      return this.$store.getters.config.customColumns;
    },
    zoom: function () {
      return this.$store.getters.config.zoom;
    },
    darkTheme: function () {
      return this.$store.getters.config.darkTheme;
    },
    resizableStyle: function () {
      if (this.showCalendar && this.showCustomList) {
        return { height: this.calendarHeight };
      } else {
        return {};
      }
    },
    selectedTodo: function () {
      if (this.$store.getters.actions.selectedTodo) {
        return this.$store.getters.actions.selectedTodo;
      }
      return null;
    },
    activeTodo: function () {
      if (this.$store.getters.activeTodo) {
        return this.$store.getters.activeTodo;
      }
      return null;
    },
    mainDividerPositionClass: function () {
      if (this.$store.getters.config.mainDividerPosition == 0) {
        return "on-bottom";
      } else if (this.$store.getters.config.mainDividerPosition == 1) {
        return "on-center";
      } else {
        return "on-top";
      }
    },
    hideTopListContainer: function () {
      if (!this.$store.getters.config.customList || !this.$store.getters.config.calendar) return false;

      return this.$store.getters.config.mainDividerPosition == 2 ? true : false;
    },
    hideBottomListContainer: function () {
      if (!this.$store.getters.config.customList || !this.$store.getters.config.calendar) return false;

      return this.$store.getters.config.mainDividerPosition == 0 ? true : false;
    },
  },
};
</script>

<style lang="scss">
@import "/src/assets/style/globalVars.scss";

body {
  line-height: unset !important;
}

.todo-lists-container {
  display: flex;
  overflow: auto;
  min-height: 5px;
  height: 5px;
  transition: height 0.15s ease-out 0s;
  margin-top: 20px;
  margin-bottom: 25px;
  // margin-bottom: 5px;
}

.slider-btn {
  padding: 3px;
  font-size: 2rem;
  align-self: center;
  flex-grow: 0;
  margin-left: 6px;
  margin-right: 6px;
  cursor: pointer;
  transition: 0.4s cubic-bezier(0.2, 1, 0.1, 1);
}

.slider-btn:hover {
  border-radius: 6px;
  background-color: #eaecef;
}

.slider-btn:active {
  background-color: #dddfe2;
}

.v3dp__popout {
  border-radius: 7px !important;
}

.side-bar .v3dp__popout {
  margin-left: 72px;
  margin-top: 0px;
}

.todo-slider {
  flex-grow: 1;
  display: flex;
  overflow-x: hidden;
  min-height: -webkit-fill-available;
  min-height: -moz-available;
  height: fit-content;
}

@-moz-document url-prefix() {
  .todo-slider {
    min-height: -moz-available;
    height: unset;
  }
}

.slides {
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}

.dark-theme *::-webkit-scrollbar-thumb {
  background: #333940;
  border-radius: 5px;
}

.dark-theme *::-webkit-scrollbar-thumb:hover {
  background: #39484f;
}

.dark-theme *::-webkit-scrollbar-thumb:active {
  background: #51656f;
}

.full-screen {
  height: 100%;
  resize: unset;
}

.full-screen .todo-slider {
  margin-top: 20px;
}

/*----------------Dark Theme------------------*/
.dark-theme {
  background-color: #13171d;
  color: #c9d1d9;
}

.dark-theme input {
  background-color: #13171d;
  color: #c9d1d9;
}

.dark-theme input.form-range {
  background-color: unset;
}

.dark-theme .slider-btn:hover {
  border-radius: 6px;
  background-color: #21262d;
}

.dark-theme .slider-btn:active {
  background-color: #2a2e36;
}

.mobile {
  width: 100%;
  height: 100%;
  z-index: 999;
  position: absolute;
  padding: 20%;
}

.dark-theme .mobile {
  background-color: #13171d;
}

.compatible {
  width: 100%;
  height: 100%;
  z-index: 999;
  /*position: absolute;*/
}

.hidden-input-for-focus {
  position: absolute;
  top: -100px;
}

.main-horizontal-divider {
  z-index: 5;

  &.on-top {
    cursor: unset;

    .inner-main-horizontal-divider {
      display: none;
    }

    .divider-icons-container {
      margin-top: 5px;
      visibility: visible;
      opacity: 0.3;
    }

    .move-to-corner-down,
    .move-to-corner-up,
    .move-to-center-up {
      display: none;
    }
  }

  &.on-bottom {
    cursor: unset;

    .inner-main-horizontal-divider {
      display: none;
    }

    .divider-icons-container {
      margin-top: -25px;
      visibility: visible;
      opacity: 0.3;
    }

    .move-to-corner-up,
    .move-to-corner-down,
    .move-to-center-down {
      display: none;
    }
  }

  &.on-center {
    .move-to-center-down,
    .move-to-center-up {
      display: none;
    }
  }

  &:hover {
    .divider-icons-container {
      visibility: visible;
      opacity: 1;
    }
  }
}

.divider-icons-container {
  visibility: hidden;
  opacity: 0;
  transition: 0.4s cubic-bezier(0.2, 1, 0.1, 1);
  z-index: 6;
  position: absolute;
  right: 70px;
  margin-top: -8px;
}

.divider-icons {
  @include btn-icon;
  padding: 6px;
  background-color: white;

  &:hover {
    opacity: 1;
  }

  .dark-theme & {
    background-color: #13171d;
  }
}

.hidden-lists-container {
  height: 0px !important;
  margin: 0px;
  min-height: 0px;
}

.full-screen-divider {
  height: 100% !important;
}

/* 移动端全局适配 */
@media (max-width: 768px) {
  .app-body {
    overflow-x: auto;
    padding-bottom: 70px;  /* 为底部导航栏预留空间 */
    touch-action: pan-x pan-y;  /* 允许双指缩放，但保持滚动 */
  }
  
  .todo-lists-container {
    margin-top: 8px;
    margin-bottom: 12px;
  }
  
  .todo-slider {
    scroll-snap-type: x mandatory;  /* 启用吸附滚动 */
    scroll-behavior: smooth;         /* 平滑滚动 */
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* iOS 滚动优化 */
  }
  
  .to-do-list-container {
    scroll-snap-align: start;  /* 吸附到左侧 */
  }
  
  .slider-btn {
    display: none;  /* 移动端隐藏左右切换按钮 */
  }
  
  .main-horizontal-divider {
    display: none;  /* 移动端隐藏分隔条 */
  }
  
  .divider-icons {
    padding: 4px;
  }
  
  /* 隐藏 zoom 功能，移动端不适用 */
  .app-body {
    zoom: 100% !important;
  }
}

/* 双指缩放视觉反馈 */
.app-body {
  transition: font-size 0.1s ease-out;
}

/* 禁用浏览器默认双指缩放 */
@media (max-width: 768px) {
  html {
    touch-action: pan-x pan-y pinch-zoom;
  }
  
  body {
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }
}
</style>
