import { DataPath, isDataDirCanRead, isDataDirCanWrite } from '../../lib/config.js';
import { getFile, getLocale } from '../../lib/functions.js';
import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
const jsonPath = path.join(DataPath, 'bookmarks.json');
const defaultJson = '{}';
const langRaw = getLocale();
const lang = langRaw.ipc.bookmark;

// 获取书签
ipcMain.handle('bookmarks-get', () => {
  if (!isDataDirCanRead || !isDataDirCanWrite) return {};
  try {
    const data = getFile(jsonPath, defaultJson);
    return data;
  } catch (err) {
    dialog.showErrorBox(lang.get.errorTitle, err.stack);
    return {};
  }
});

// 添加书签
ipcMain.on('bookmarks-add', (_, name, url, time) => {
  try {
    if (!isDataDirCanWrite) throw new Error(lang.add.errorInfo);
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    data[time] = { title: name, url: url };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox(lang.add.errorTitle, err.stack);
  }
});

// 删除书签
ipcMain.on('bookmarks-del', (_, id) => {
  try {
    if (!isDataDirCanWrite) throw new Error(lang.del.errorInfo);
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    delete data[id];
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox(lang.del.errorTitle, err.stack);
  }
});