const { ipcMain, dialog } = require('electron');
const { DataPath } = require('../../lib/config');
const { getFile } = require('../../lib/function');
const defaultJson = '{}';
const fs = require('fs');
const path = require('path');
const jsonPath = path.join(DataPath, 'bookmarks.json');

// 获取书签
ipcMain.handle('bookmarks-get', () => {
  try {
    const data = getFile(jsonPath, defaultJson);
    return data;
  } catch (err) {
    dialog.showErrorBox('书签获取错误', err.stack);
    return {};
  }
});

// 添加书签
ipcMain.on('bookmarks-add', (_, name, url, time) => {
  try {
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    data[time] = { title: name, url: url };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack);
  }
});

// 删除书签
ipcMain.on('bookmarks-del', (_, id) => {
  try {
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    delete data[id];
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签删除错误', err.stack);
  }
});