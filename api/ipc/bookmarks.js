const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { DataPath, getJson } = require('../../lib/function');

// 获取书签
ipcMain.handle('bookmarks-get', () => getJson('bookmarks.json', '书签文件读取错误'));

// 添加书签
ipcMain.on('bookmarks-add', (_, name, url, time) => {
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    data[time] = { title: name, url: url };
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack);
  }
});

// 删除书签
ipcMain.on('bookmarks-del', (_, id) => {
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    delete data[id];
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签删除错误', err.stack);
  }
});