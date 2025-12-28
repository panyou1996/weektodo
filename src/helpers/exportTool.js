import storageRepository from "../repositories/storageRepository";
import dbRepository from "../repositories/dbRepository";
import supabaseRepository from "../repositories/supabaseRepository";
import { Toast, Modal } from "bootstrap";
import migrations from "../migrations/migrations";
import isElectron from "is-electron";

export default {
  export() {
    var filename = "WeekToDoBackup.wtdb";
    var data = storageRepository.as_json();
    data.todoLists = {};
    data.repeating_events = {};
    data.repeating_events_by_date = {};
    let db_req = dbRepository.open();

    db_req.onsuccess = function (event) {
      var db = event.target.result;
      let request = dbRepository.selectAll(db, "todo_lists");
      request.onsuccess = function () {
        let cursor = request.result;
        if (cursor) {
          data.todoLists[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          getRepeatinEventData(filename, data, event);
        }
      };
    };
  },
  import(event) {
    let fr = readFile(event.target.files);
    fr.onload = function () {
      var toast = new Toast(document.getElementById("invalidFile"));
      try {
        var data = JSON.parse(fr.result);
        if ("config" in data) {
          importData(data);
          migrations.migrate();
        } else {
          toast.show();
        }
      } catch (e) {
        toast.show();
      }
    };
  },
  clear() {
    if (isElectron()) {
      const { ipcRenderer } = require("electron");
      ipcRenderer.send("clear-config");
    }

    storageRepository.clean();
    let db_req = dbRepository.open();
    db_req.onsuccess = function (event) {
      var db = event.target.result;
      let request = dbRepository.clear(db, "todo_lists");
      request.onsuccess = function () {
        let request2 = dbRepository.clear(db, "repeating_events");
        request2.onsuccess = function () {
          let request3 = dbRepository.clear(db, "repeating_events_by_date");
          request3.onsuccess = function () {
            location.reload();
          };
        };
      };
    };
  },

  /**
   * 上传到云端
   */
  async uploadToCloud() {
    try {
      // 检查是否设置了密钥
      if (!supabaseRepository.hasSyncKey()) {
        const key = prompt('请输入同步密钥（用于跨设备同步）：');
        if (!key || key.trim().length < 3) {
          return { success: false, message: '密钥至少 3 个字符' };
        }
        supabaseRepository.getSyncKey(key.trim());
      }
      
      const data = await this.exportToJson();
      const jsonString = JSON.stringify(data);
      
      await supabaseRepository.uploadBackup(jsonString);
      
      return { success: true, message: '上传成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * 从云端下载
   */
  async downloadFromCloud() {
    try {
      // 检查是否设置了密钥
      if (!supabaseRepository.hasSyncKey()) {
        const key = prompt('请输入同步密钥（与上传时设置的相同）：');
        if (!key || key.trim().length < 3) {
          return { success: false, message: '密钥至少 3 个字符' };
        }
        supabaseRepository.getSyncKey(key.trim());
      }
      
      const jsonString = await supabaseRepository.downloadLatestBackup();
      const data = JSON.parse(jsonString);
      
      if (!('config' in data)) {
        throw new Error('无效的备份文件');
      }
      
      importData(data);
      migrations.migrate();
      
      // 不自动刷新，由用户决定
      return { success: true, message: '下载成功，页面将刷新', shouldReload: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * 导出为 JSON（用于云同步）
   */
  async exportToJson() {
    return new Promise((resolve) => {
      var data = storageRepository.as_json();
      data.todoLists = {};
      data.repeating_events = {};
      data.repeating_events_by_date = {};
      let db_req = dbRepository.open();

      db_req.onsuccess = function (event) {
        var db = event.target.result;
        let request = dbRepository.selectAll(db, "todo_lists");
        request.onsuccess = function () {
          let cursor = request.result;
          if (cursor) {
            data.todoLists[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            collectRepeatinEventData(data, event, resolve);
          }
        };
      };
    });
  },
};

function getRepeatinEventData(filename, data, event) {
  var db = event.target.result;
  let request = dbRepository.selectAll(db, "repeating_events");
  request.onsuccess = function () {
    let cursor = request.result;
    if (cursor) {
      data.repeating_events[cursor.key] = cursor.value;
      cursor.continue();
    } else {
      getRepeatinEventByDateData(filename, data, event);
    }
  };
}

function getRepeatinEventByDateData(filename, data, event) {
  var db = event.target.result;
  let request = dbRepository.selectAll(db, "repeating_events_by_date");
  request.onsuccess = function () {
    let cursor = request.result;
    if (cursor) {
      data.repeating_events_by_date[cursor.key] = cursor.value;
      cursor.continue();
    } else {
      let string_data = JSON.stringify(data);
      createExportLink(filename, string_data);
    }
  };
}

function createExportLink(filename, fileBody) {
  var element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileBody));
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  setTimeout(function () {
    let exportingModal = Modal.getInstance(document.getElementById("exportingModal"));
    exportingModal.hide();
  },1000);
}

function readFile(files) {
  const fileList = files;
  var fr = null;
  if (fileList[0]) {
    fr = new FileReader();
    fr.readAsText(fileList[0]);
  }
  return fr;
}

function importData(data) {
  importLocalStorageData(data);
  importIndexedDbData(data, "todo_lists");
}

function importLocalStorageData(data) {
  storageRepository.clean();
  var configData = JSON.parse(data.config);
  configData.importing = true;
  data.config = JSON.stringify(configData)
  storageRepository.load_json(data);
}

function importIndexedDbData(a_data, table) {
  var data = a_data;
  let db_req = dbRepository.open();
  db_req.onsuccess = function (event) {
    let db = event.target.result;
    let request = dbRepository.clear(db, table);
    request.onsuccess = function () {
      importDbRecords(db, data, table);
    };
  };
}

function importDbRecords(db, data_a, table) {
  var keys, data;

  if (table == "todo_lists") {
    keys = Object.keys(data_a.todoLists);
    data = data_a.todoLists;
  } else if (table == "repeating_events") {
    if (!('repeating_events' in data_a)) location.reload(); // if not exist is an old data, finish the import and reload
    keys = Object.keys(data_a.repeating_events);
    data = data_a.repeating_events;
  } else {
    keys = Object.keys(data_a.repeating_events_by_date);
    data = data_a.repeating_events_by_date;
  }

  var i = keys.length;
  var req;

  if (i == 0) {
    if (table == "todo_lists") {
      importIndexedDbData(data_a, "repeating_events");
    } else if (table == "repeating_events") {
      importIndexedDbData(data_a, "repeating_events_by_date");
    } else {
      location.reload();
    }
  } else {
    while (i--) {
      req = dbRepository.add(db, table, keys[i], data[keys[i]]);
    }
    req.onsuccess = function () {
      if (table == "todo_lists") {
        importIndexedDbData(data_a, "repeating_events");
      } else if (table == "repeating_events") {
        importIndexedDbData(data_a, "repeating_events_by_date");
      } else {
        location.reload();
      }
    };
  }
}

// 收集重复事件数据（用于云同步）
function collectRepeatinEventData(data, event, resolve) {
  var db = event.target.result;
  let request = dbRepository.selectAll(db, "repeating_events");
  request.onsuccess = function () {
    let cursor = request.result;
    if (cursor) {
      data.repeating_events[cursor.key] = cursor.value;
      cursor.continue();
    } else {
      collectRepeatinEventByDateData(data, event, resolve);
    }
  };
}

// 收集按日期的重复事件数据（用于云同步）
function collectRepeatinEventByDateData(data, event, resolve) {
  var db = event.target.result;
  let request = dbRepository.selectAll(db, "repeating_events_by_date");
  request.onsuccess = function () {
    let cursor = request.result;
    if (cursor) {
      data.repeating_events_by_date[cursor.key] = cursor.value;
      cursor.continue();
    } else {
      resolve(data);
    }
  };
}
