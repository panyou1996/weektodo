<template>
  <div class="modal fade" :class="{ 'fullscreen': fullscreenToDoModal }" @keydown.esc="pressEsc" id="toDoModal"
    tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <div class="header-left">
            <div class="todo-list-selector">
              <div v-show="showingCalendar" class="date-picker-btn" @click="showCalendar()">
                <i class="bi-calendar-event"></i>
                <datepicker id="todo-date-picker-input" v-model="pickedDate" :locale="language"
                  :input-format='"dd/MM/yyyy"' :weekStartsOn="weekStartOnMonday" />
              </div>
              <div v-show="!showingCalendar" class="date-picker-btn">
                <div class="date-picker-btn" id="customListDropDown" data-bs-toggle="dropdown">
                  <i class="bi-view-list"></i>
                  <div id="todo-list-select">{{ pickedCListName }}</div>
                </div>
                <ul class="dropdown-menu" aria-labelledby="customListDropDown">
                  <li v-for="option in cListOptions" :key="option.listId" :value="option.listId">
                    <button class="dropdown-item" type="button" @click="pickedCList = option.listId">
                      <i class="bi-check2" :style="{
                        visibility: option.listId == pickedCList ? 'visible' : 'hidden',
                      }"></i>
                      <span>{{ option.listName }}</span>
                    </button>
                  </li>
                </ul>
              </div>
              <div v-if="showCL && showCal" class="selector-divider-container">
                <div class="selector-divider"></div>
                <i id="btnGroupDrop1" class="bi-chevron-down" type="button" data-bs-toggle="dropdown"></i>
                <ul class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                  <li>
                    <button class="dropdown-item" type="button" @click="showingCalendar = true">
                      <i class="bi-calendar-check"></i>
                      <span>{{ $t("settings.calendar") }}</span>
                    </button>
                  </li>
                  <li>
                    <button class="dropdown-item" type="button" @click="showingCalendar = false">
                      <i class="bi-view-list"></i>
                      <span>{{ $t("settings.customLists") }}</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="header-right">
            <time-picker :time="todo.time" @time-selected="changeTime"></time-picker>
            <i :class="{ 'bi-bell': !todo.alarm, 'bi-bell-fill': todo.alarm }" class="header-menu-icons"
              @click="changeAlarm" :title="$t('todoDetails.alarm')"></i>
            <repeating-event v-if="showingCalendar" :repeatingEvent="todo.repeatingEvent" :todo="todo"
              @repeatingEventSelected="changeRepeatingEvent"></repeating-event>
            <color-picker :color="todo.color" @color-selected="changeColor"></color-picker>
            <i id="btnTaskOptionMenu" class="bi-three-dots-vertical header-menu-icons" type="button"
              data-bs-toggle="dropdown" :title="$t('todoDetails.actions')"></i>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="btnTaskOptionMenu">
              <li>
                <button class="dropdown-item" type="button" @click="copyTodo">
                  <i class="bi-clipboard"></i>
                  <span>{{ $t("donate.copy") }}</span>
                </button>
              </li>
              <li>
                <button class="dropdown-item" type="button" @click="duplicateTodo" data-bs-dismiss="modal">
                  <i class="bi-back"></i>
                  <span>{{ $t("todoDetails.duplicate") }}</span>
                </button>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <button class="dropdown-item" type="button" @click="removeTodo" data-bs-dismiss="modal">
                  <i class="bi-trash"></i> <span>{{ $t("ui.remove") }}</span>
                </button>
              </li>
              <li v-if="todo.repeatingEvent">
                <button class="dropdown-item" type="button" @click="removeAll" data-bs-dismiss="modal">
                  <i class="bi-trash"></i> <span>{{ $t("ui.removeAll") }}</span>
                </button>
              </li>
            </ul>
            <i class="bi-x close-modal header-menu-icons" ref="closeModal" data-bs-dismiss="modal"
              :title="$t('todoDetails.close')"></i>
          </div>
        </div>
        <div class="modal-body">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="todo-header" v-model="todo.checked"
              @change="checkTodoClickhandler(false)" />
            <div class="title-container">
              <label v-show="!editingTitle" class="form-check-label todo-title" for="todo-header"
                :class="{ 'completed-task': todo.checked }" @dblclick="editTitle">
                <span v-html="todoText"></span>
              </label>
              <label v-show="!editingTitle && todo.text == ''" class="form-check-label todo-title todo-title-empty-title"
                for="todo-header" @dblclick="editTitle">
                {{ $t("todoDetails.taskTitle") }}
              </label>
              <input v-show="editingTitle" class="todo-title-input" type="text" v-model="todo.text" ref="titleInput"
                :placeholder="$t('todoDetails.taskTitle')" @blur="doneEditTitle()" @keyup.enter="doneEditTitle()" />
              <description-text-area :todoDesc="todo.desc"
                @updated-description="changeDescription"></description-text-area>
            </div>
          </div>
          <div class="mt-3"></div>
          <div class="horizontal-divider mb-0 mt-3"></div>
          <ul class="sub-tasks">
            <li v-for="(subTask, index) in todo.subTaskList" :key="index" class="sub-task">
              <div v-show="!subTask.editing" draggable="true" @dragstart="startDrag($event, index)" @dragover.prevent>
                <div class="d-flex flex-row align-items-center" :class="{ checked: subTask.checked }">
                  <input class="form-check-input flex-grow-1 mx-3 mt-0" type="checkbox" v-model="subTask.checked"
                    :id="'sub-task-' + index" @change="changeSubTaskClickhandler(index)" />
                  <label class="form-check-label" :for="'sub-task-' + index" @dragenter.self="onDragenter($event)"
                    @dragleave.self="onDragleave($event)" @drop="onDrop($event, index)" @dragover.prevent>
                    <span v-html="linkifyText(subTask.text)"></span>
                  </label>
                  <i class="bi-trash mx-2" :title="$t('ui.remove')" @click="removeSubTask(index)"></i>
                </div>
              </div>
              <input v-show="subTask.editing" v-model="subTask.text" @blur="doneEditSubTask(index)"
                @keyup.enter="doneEditSubTask(index)" :ref="'subTaskEdit' + index" class="edit-sub-task" />
            </li>
            <div class="new-sub-task d-flex align-items-center">
              <label for="new-sub-task"><i class="bi-plus-square mx-3"></i></label>
              <input type="text" id="new-sub-task" :placeholder="$t('todoDetails.addSubTask')" autocomplete="off"
                @blur="addSubTask()" @keyup.enter="addSubTask()" v-model="newSubTask.text" ref="newSubTask" />
            </div>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1056">
    <toast-message id="copiedTaskToClipboard" :text="$t('todoDetails.copiedTaskToClipboard')"></toast-message>
    <toast-message id="taskRemoved" :text="$t('todoDetails.taskRemoved')" :sub-text="'(' + $t('ui.undo') + ')'"
      @subTextClick="undoRemoveTask"></toast-message>
    <toast-message id="recurrentTaskRemoved" :text="$t('todoDetails.recurrentTaskRemoved')"></toast-message>
    <toast-message id="taskDuplicated" :text="$t('todoDetails.taskDuplicated')"></toast-message>
  </div>

  <comfirm-modal :id="'removeReModalToDoDetails'" :title="$t('ui.removeRepeatingTask')"
    :text="$t('ui.repeatingTaskRemoveConfirm')" :ico="'bi-x-circle'" :okText="$t('ui.remove')" @on-ok="removeAllComfirmed"
    @on-cancel="removeAllCanceled"></comfirm-modal>
</template>

<script>
import Datepicker from "vue3-datepicker";
import toDoListRepository from "../../repositories/toDoListRepository";
import moment from "moment";
import dbRepository from "../../repositories/dbRepository";
import { Toast, Modal } from "bootstrap";
import toastMessage from "../../components/toastMessage";
import colorPicker from "./colorPicker";
import timePicker from "./timePicker";
import repeatingEvent from "./repeatingEvent";
import notifications from "../../helpers/notifications";
import repeatingEventHelper from "../../helpers/repeatingEvents.js";
import languageHelper from "../../helpers/languageHelper.js"
import repeatingEventRepository from "../../repositories/repeatingEventRepository";
import comfirmModal from "../../components/comfirmModal.vue";
import linkifyStr from 'linkify-string';
import ClickHandler from "@manuelernestog/click-handler";
import tasksHelper from "../../helpers/tasksHelper";
import descriptionTextArea from './descriptionTextArea.vue'

export default {
  name: "toDoModal",
  data() {
    return {
      pickedDate: new Date(),
      pickedCList: "",
      pickedCListName: "",
      cListOptions: [],
      todo: {
        text: "",
        checked: false,
        desc: "",
        subTaskList: [],
        alarm: false,
      },
      todoList: null,
      index: 0,
      newSubTask: { text: "", checked: false, editing: false },
      tempTitle: "",
      tempSubTask: "",
      editingTitle: false,
      showingCalendar: true,
      loadingView: false,
      options: { target: '_blank', defaultProtocol: 'https' },
      clickhandler: new ClickHandler(),
    }
  },
  props: {
    selectedTodo: { required: true, type: Object },
  },
  components: {
    colorPicker,
    Datepicker,
    toastMessage,
    timePicker,
    repeatingEvent,
    comfirmModal,
    descriptionTextArea
  },
  methods: {
    removeSubTask: function (index) {
      this.todo.subTaskList.splice(index, 1);
      this.updateTodo();
    },
    addSubTask: function () {
      if (this.newSubTask.text != "") {
        var newTodo = {
          text: this.newSubTask.text,
          checked: false,
          editing: false,
        };
        this.todo.subTaskList.push(newTodo);
        this.newSubTask.text = "";
      }
      this.updateTodo();
    },
    cancelAddSubTask: function () {
      this.newSubTask.text = "";
      this.$refs["newSubTask"].blur();
    },
    editSubTask: function (index) {
      this.todo.subTaskList[index].editing = true;
      this.$nextTick(function () {
        this.$refs["subTaskEdit" + index][0].focus();
        this.$refs["subTaskEdit" + index][0].select();
        this.tempSubTask = this.todo.subTaskList[index].text;
      });
    },
    doneEditSubTask: function (index) {
      this.todo.subTaskList[index].editing = false;
      this.updateTodo();
    },
    cancelEditSubTask: function (index) {
      this.todo.subTaskList[index].text = this.tempSubTask;
      this.$refs["subTaskEdit" + index].blur();
    },
    editTitle: function () {
      this.editingTitle = true;
      this.$nextTick(function () {
        this.tempTitle = this.todo.text;
        this.$refs["titleInput"].focus();
        this.$refs["titleInput"].select();
      });
    },
    cancelEditTitle: function () {
      this.todo.text = this.tempTitle;
      this.$refs["titleInput"].blur();
    },
    doneEditTitle: function () {
      this.editingTitle = false;
      this.updateTodo();
    },
    startDrag: function (event, index) {
      event.dataTransfer.setData("index", index);
    },
    onDragenter: function (event) {
      event.target.parentElement.classList.add("drag-hover");
    },
    onDragleave: function (event) {
      event.target.parentElement.classList.remove("drag-hover");
    },
    onDrop: function (event, to_index) {
      let from_index = event.dataTransfer.getData("index");
      let sub_task = this.todo.subTaskList.splice(parseInt(from_index), 1)[0];
      this.todo.subTaskList.splice(to_index, 0, sub_task);
      event.target.parentElement.classList.remove("drag-hover");
      this.updateTodo();
    },
    showCalendar: function () {
      document.getElementById("todo-date-picker-input").focus();
    },
    checkTodoClickhandler: function (resetRepeatinEvent = true) {
      this.clickhandler.handle(function () { this.checkTodo(resetRepeatinEvent) }.bind(this), function () { })
    },
    checkTodo: function (resetRepeatinEvent = true) {
      if (this.todo.checked) {
        if (this.$store.getters.config.moveCompletedTaskToBottom) {
          this.$store.commit("moveTodoToEnd", { toDoListId: this.todo.listId, index: this.index });
        }
        this.index = this.todoList.length - 1;
      }
      this.updateTodoWithReorder(resetRepeatinEvent);
    },
    updateTodo: function (resetRepeatinEvent = true) {
      if (resetRepeatinEvent) {
        this.todo.repeatingEvent = null;
      }
      this.updateTodoList(this.todo.listId, this.todoList);
    },
    updateTodoWithReorder: function (resetRepeatinEvent = true) {
      if (resetRepeatinEvent) {
        this.todo.repeatingEvent = null;
      }

      if (this.$store.getters.config.autoReorderTasks) {
        this.updateTodoList(this.todo.listId, tasksHelper.reorderTasksList(this.todoList));
      } else {
        this.updateTodoList(this.todo.listId, this.todoList);
      }
    },
    updateTodoList: function (todoListId, TodoList) {
      notifications.refreshDayNotifications(this, todoListId);
      toDoListRepository.update(todoListId, TodoList);
    },
    getCListOptions: function () {
      this.cListOptions = this.$store.getters.cTodoListIds;
    },
    moveToTodoList: function (newListID) {
      if (newListID == "Invalid date" || newListID == "") return;

      if (moment(newListID, "YYYYMMDD", true).isValid()) {
        this.pickedCListName = "";
        this.pickedCList = "";
      } else {
        this.cListOptions.forEach((x) => {
          if (x.listId == this.pickedCList) {
            this.pickedCListName = x.listName;
          }
        });
      }

      let oldListId = this.todo.listId;
      this.todoList.splice(this.index, 1);
      this.updateTodoList(oldListId, this.todoList);
      this.todo.listId = newListID;
      this.todo.repeatingEvent = null;
      if (this.$store.getters.todoLists[newListID]) {
        this.$store.commit("addTodo", this.todo);
        this.todoList = this.$store.getters.todoLists[this.todo.listId];
        this.index = this.todoList.length - 1;
        this.todo = this.todoList[this.index];

        if (this.$store.getters.config.autoReorderTasks) {
          this.updateTodoList(newListID, tasksHelper.reorderTasksList(this.todoList));
        } else {
          this.updateTodoList(newListID, this.todoList);
        }

      } else {
        this.loadToDoFormDB(newListID);
      }
    },
    loadToDoFormDB: function (newListID) {
      let db_req = dbRepository.open();
      var instancePointer = this;
      db_req.onsuccess = function (event) {
        let db = event.target.result;
        var get_req = dbRepository.get(db, "todo_lists", newListID);
        get_req.onsuccess = function (event) {
          let newTodoList = event.target.result ? event.target.result : [];
          newTodoList.push(instancePointer.todo);
          instancePointer.todoList = newTodoList;
          instancePointer.index = newTodoList.length - 1;
          this.updateTodoList(newListID, instancePointer.todoList);
        }.bind(this);
      }.bind(this);
    },
    removeTodo: function () {
      this.$store.commit("setUndoElement", { type: 'task', todo: this.todo, index: this.index });
      this.$store.commit("removeTodo", { toDoListId: this.todo.listId, index: this.index });
      this.updateTodoList(this.todo.listId, this.$store.getters.todoLists[this.todo.listId]);
      let toast = new Toast(document.getElementById("taskRemoved"));
      toast.show();
    },
    undoRemoveTask: function () {
      let obj = this.$store.getters.undoElement;
      this.$store.commit("insertTodo", { toDoListId: obj.todo.listId, index: obj.index, toDo: obj.todo });
      this.updateTodoList(obj.todo.listId, this.$store.getters.todoLists[obj.todo.listId]);
      let toast = new Toast(document.getElementById("taskRemoved"));
      toast.hide();
    },
    removeAll: function () {
      let modal = new Modal(document.getElementById("removeReModalToDoDetails"), { backdrop: "static", });
      modal.show();
    },
    removeAllComfirmed() {
      repeatingEventRepository.remove(this.todo.repeatingEvent);
      this.$store.commit("removeRepeatingEvent", this.todo.repeatingEvent);
      this.$store.getters.selectedDates.forEach((date) => {
        repeatingEventHelper.removeGeneratedRepeatingEvents(date, this);
      });
      this.$store.commit("resetRepeatingEventDateCache");
      this.$store.commit("loadRepeatingEventDateCache", this.$store.getters.repeatingEventList);
      let toast = new Toast(document.getElementById("recurrentTaskRemoved"));
      toast.show();
    },
    removeAllCanceled() {
      let modal = new Modal(document.getElementById("toDoModal"));
      modal.show();
    },
    duplicateTodo: function () {
      var newTodo = {
        text: this.todo.text,
        checked: this.todo.checked,
        listId: this.todo.listId,
        desc: this.todo.desc,
        subTaskList: this.todo.subTaskList,
        color: this.todo.color,
        priority: 0,
        tags: [],
        time: this.todo.time,
        alarm: this.todo.alarm,
        repeatingEvent: null,
      };
      this.$store.commit("addTodo", newTodo);

      if (this.$store.getters.config.autoReorderTasks) {
        this.updateTodoList(this.todo.listId, tasksHelper.reorderTasksList(this.$store.getters.todoLists[this.todo.listId]));
      } else {
        this.updateTodoList(this.todo.listId, this.$store.getters.todoLists[this.todo.listId]);
      }

      let toast = new Toast(document.getElementById("taskDuplicated"));
      toast.show();
    },
    async copyTodo() {
      await navigator.clipboard.writeText(this.todoToString());
      let toast = new Toast(document.getElementById("copiedTaskToClipboard"));
      toast.show();
    },
    todoToString() {
      var text = "";
      text += this.todo.text;
      if (this.todo.desc != "") {
        text += "\n\n";
        text += this.$t("todoDetails.notes") + ":\n\n";
        text += this.todo.desc;
      }
      if (this.todo.subTaskList.length > 0) {
        text += "\n\n";
        text += this.$t("todoDetails.subtasks") + ":\n\n";
        this.todo.subTaskList.forEach(function (task) {
          text += "- " + task.text + "\n";
        });
      }
      return text;
    },
    changeColor(color) {
      this.todo.color = color;
      this.updateTodo();
    },
    changeTime(time) {
      this.todo.time = time;
      if (!time) {
        this.todo.alarm = false;
      }
      this.updateTodoWithReorder();
    },
    changeAlarm() {
      if (this.todo.time) {
        this.todo.alarm = this.todo.alarm ? false : true;
        this.updateTodo();
      }
    },
    changeDescription(desc) {
      this.todo.desc = desc;
      this.updateTodo();
    },
    changeRepeatingEvent(repeatingEvent) {
      this.todo.repeatingEvent = repeatingEvent;
      this.updateTodo(false);
    },
    changeSubTaskClickhandler: function (index) {
      this.clickhandler.handle(function () { this.changeSubTask(index) }.bind(this), function () { this.editSubTask(index) }.bind(this), index);
    },
    changeSubTask: function (index) {
      if (this.todo.subTaskList[index].checked && this.moveSubtaskToBotttom) {
        this.todo.subTaskList.push(this.todo.subTaskList.splice(index, 1)[0]);
      }
      this.updateTodo();
    },
    linkifyText: function (text) {
      return linkifyStr(text, this.options);
    },
    pressEsc: function () {
      if (document.activeElement.id == "toDoModal") {
        this.$refs.closeModal.click();
      }
    }
  },
  watch: {
    selectedTodo: function (newVal) {
      this.todoList = this.$store.getters.todoLists[newVal.toDo.listId];
      this.index = newVal.index;
      this.todo = this.todoList[this.index];
      if (this.todo["desc"] == undefined) {
        this.todo["desc"] = "";
        this.todo["subTaskList"] = [];
        this.todo["color"] = "none";
        this.todo["priority"] = 0;
        this.todo["tags"] = [];
        this.todo["time"] = null;
        this.todo["alarm"] = false;
        this.todo["repeatingEvent"] = null;
      }
      this.showingCalendar = moment(this.todo.listId, "YYYYMMDD", true).isValid();
      this.getCListOptions();
      this.loadingView = true;
      if (this.showingCalendar) {
        this.pickedDate = moment(this.todo.listId).toDate();
        this.pickedCList = "";
        this.pickedCListName = "";
      } else {
        this.cListOptions.forEach((x) => {
          if (x.listId == this.todo.listId) {
            this.pickedCListName = x.listName;
          }
        });
        this.pickedCList = this.todo.listId;
        this.pickedDate = null;
      }
      this.$nextTick(function () {
        this.loadingView = false;
      });
    },
    pickedDate: function (newVal) {
      if (this.loadingView) return;

      var newListId = moment(newVal).format("YYYYMMDD");
      if (newListId != this.todo.listId) {
        this.moveToTodoList(newListId);
      }
    },
    pickedCList: function (newVal) {
      if (this.loadingView) return;

      this.moveToTodoList(newVal);
    }
  },
  computed: {
    language: function () {
      let lang = this.$store.getters.config.language;
      return languageHelper.getLanguagePack(lang);
    },
    showCL: function () {
      return this.$store.getters.config.customList;
    },
    showCal: function () {
      return this.$store.getters.config.calendar;
    },
    todoText: function () {
      return linkifyStr(this.todo.text, this.options);
    },
    fullscreenToDoModal: function () {
      return this.$store.getters.config.fullscreenToDoModal;
    },
    moveSubtaskToBotttom: function () {
      return this.$store.getters.config.moveCompletedSubTaskToBottom;
    },
    weekStartOnMonday: function () {
      return this.$store.getters.config.weekStartOnMonday ? 1 : 0;
    }
  },
};
</script>

<style scoped lang="scss">
@import "/src/assets/style/globalVars.scss";

.modal-dialog {
  max-height: 80%;

  .modal-content {
    height: 100%;

    .modal-body {
      overflow-x: hidden;
      overflow-y: auto;
      max-height: calc(100vh - 180px);
      ;
      margin: 16px 0px 16px 0px;
      padding: 0px 16px 0px 16px;
    }
  }
}

#toDoModal.fullscreen {
  .modal-dialog {
    margin: 0px;
    height: 85%;
    width: 90%;
    max-width: unset;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .sub-tasks {
      max-height: unset;
    }
  }
}

.todo-list-selector .bi-chevron-down {
  @include btn-icon;
}

.todo-list-selector .date-picker-btn {
  display: flex;
  @include btn-icon;
  padding: 0px;

  #todo-list-select {
    font-size: 15px;
  }
}

.todo-list-selector .selector-divider {
  height: 21px;
  width: 1px;
  background-color: #b9b9b9;
  margin: 0px 4px 0px 4px;
}

.todo-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 22px;
  border: 2px solid transparent;
  padding: 1px 2px 1px 2px;
}

.todo-title-input {
  font-size: 18px;
  line-height: 22px;
  width: 100%;
  font-weight: 500;
  outline: unset;
  border: 2px solid black;
  border-radius: 3px;

  .dark-theme & {
    border: 1px solid rgba(255, 255, 255, 0.658);
    background-color: unset;
  }
}

.todo-title-empty-title {
  color: grey;
  margin-left: -8px;
}



.dropdown-item {
  color: #3c3c3c;
}

.sub-tasks {
  list-style: none;
  padding: 0px 10px 10px 10px;
  margin: 0px;

  li>div {
    -webkit-user-drag: element;
  }

  .sub-task {
    border-bottom: 1px solid #eaecef;

    .dark-theme & {
      border-bottom: 1px solid #464647;
    }

    label {
      width: 100%;
      padding: 10px 5px 10px 0px;
      min-height: 38px;
      height: auto;
    }

    .form-check-input {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px;
      min-height: 16px;
    }

    i {
      color: #87888a;
      display: none;
      cursor: pointer;

      &:hover {
        color: black;
      }

      .checked & {
        opacity: 1 !important;
      }

      .dark-theme & {
        color: #babbbe;

        &:hover {
          color: white;
        }
      }
    }

    .drag-hover {
      color: rgba(157, 157, 157, 0.43);
      background-color: rgb(250, 249, 249);

      .dark-theme & {
        color: rgb(87, 87, 87);
        background-color: #1f1e20;
      }
    }

    &:hover {
      background-color: $btn-hover-bg-color;

      .dark-theme & {
        background-color: $dt-btn-hover-bg-color;
      }

      i {
        display: block;
      }
    }
  }

  .new-sub-task {
    padding: 0px 5px 0px 0px;
    width: 100%;

    i {
      color: lightgrey;
    }

    input {
      border: none;
      width: 100%;
      height: 38px;
      outline: unset;

      border: 2px solid transparent;

      .dark-theme & {
        background-color: unset;
      }

      &:focus {
        border: 2px solid black;
        border-radius: 3px;

        .dark-theme & {
          border: 1px solid rgba(255, 255, 255, 0.658);
          background-color: #21262d;
        }
      }
    }
  }

  .edit-sub-task {
    outline: unset;
    border: none;
    width: 100%;
    height: 38px;
    width: calc(100% - 48px);
    margin-left: 48px;
    border: 2px solid black;
    border-radius: 3px;

    .dark-theme & {
      border: 2px solid white;
      background-color: #21262d;
    }
  }
}

.sub-task .checked input,
.sub-task .checked label {
  opacity: 0.6;
  text-decoration: line-through;
}

.title-container {
  margin-left: 14px;
  margin-top: 1px;
}

.form-check-input {
  width: 1.3em !important;
  height: 1.3em !important;
}

.dark-theme .form-select {
  background-color: #15161e;
  border: 1px solid #30363d;
  color: #c9d1d9;
}

.form-select:focus {
  box-shadow: none;
}

.modal-dialog {
  max-width: 650px;
}

.header-menu-icons {
  margin-left: 6px;
  @include btn-icon;
}

.header-menu-icons.bi-x {
  font-size: 1.9rem;
  padding: 0px;
}

.modal.modal-static .modal-dialog {
  transform: none;
}

#todo-list-select {
  padding: 0px;
  border: none;
  background-color: unset;
  cursor: pointer;
  width: 90px;
  font-size: 15px;
  line-height: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.completed-task {
  text-decoration: line-through;
}

/* 移动端适配 - iOS 16 风格 */
@media (max-width: 768px) {
  .modal-dialog {
    max-width: 95vw;
    max-height: calc(100vh - 80px);
    margin: 0.5rem;
  }
  
  .modal-content {
    max-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    border: none;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }
  
  /* 头部优化 - 响应式布局 */
  .modal-header {
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
    padding: 0.75rem 1rem;
    border-radius: 16px 16px 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: auto;
  }
  
  /* 桌面端横向排列 */
  @media (min-width: 769px) {
    .modal-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    
    .header-left {
      flex: 1;
    }
    
    .header-right {
      flex-shrink: 0;
    }
  }
  
  .header-left,
  .header-right {
    display: flex;
    align-items: center;
  }
  
  /* 移动端全宽 */
  @media (max-width: 768px) {
    .header-left,
    .header-right {
      width: 100%;
    }
  }
  
  .header-left {
    justify-content: flex-start;
  }
  
  .header-right {
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 4px;
  }
  
  /* 日期选择器 */
  .todo-list-selector {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .date-picker-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.03);
    
    i {
      font-size: 1rem;
    }
  }
  
  #todo-list-select {
    font-size: 0.875rem;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .selector-divider-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .selector-divider {
    width: 1px;
    height: 20px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0 4px;
  }
  
  /* 头部图标按钮 */
  .header-menu-icons {
    font-size: 1.125rem;
    padding: 6px;
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background-color 0.2s;
    
    &:active {
      background-color: rgba(0, 0, 0, 0.06);
    }
  }
  
  .close-modal {
    font-size: 1.5rem;
  }
  
  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  
  .modal-body {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
    padding-bottom: 2rem;
    -webkit-overflow-scrolling: touch;
  }
  
  /* 任务标题 - 字体优化 */
  .todo-title {
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 500;
  }
  
  .todo-title-input {
    font-size: 1rem;
    border: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 0;
    padding: 0.5rem 0;
    
    &:focus {
      border-bottom-color: #007aff;
      box-shadow: none;
    }
  }
  
  /* 复选框优化 */
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #c7c7cc;
    
    &:checked {
      background-color: #007aff;
      border-color: #007aff;
    }
  }
  
  /* 按钮优化 - iOS 风格 */
  .btn {
    min-height: 44px;
    font-size: 0.9375rem;
    font-weight: 600;
    border-radius: 12px;
    letter-spacing: -0.02em;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:active {
      transform: scale(0.98);
    }
  }
  
  .btn-primary {
    background-color: #007aff;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
    
    &:hover {
      background-color: #0051d5;
    }
  }
  
  /* 子任务列表 */
  .subtask-item {
    padding: 0.625rem 0;
    min-height: 44px;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
    font-size: 0.9375rem;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  /* 描述文字 */
  .description-text,
  textarea {
    font-size: 0.9375rem;
    line-height: 1.5;
  }
  
  /* 颜色选择器 */
  .color-picker-item {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:active {
      transform: scale(0.9);
    }
  }
  
  /* 表单控件 */
  .form-control,
  .form-select {
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    
    &:focus {
      border-color: #007aff;
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }
  }
}
</style>
