import { DataPath } from '../../libs/config.js';
import { getFile, getLocale } from '../../libs/functions.js';
import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
const jsonPath = path.join(DataPath.basic, 'bookmarks.json');
const defaultJson = '{}';
const langRaw = getLocale();
const lang = langRaw.ipc.bookmark;

// 获取书签
ipcMain.handle('bookmarks-get', () => {
  if (!DataPath.access.RW) return {};
  try {
    const data = getFile(jsonPath, defaultJson);
    return data;
  } catch (err) {
    debugLog('error', 'Failed to retrieve bookmark list:', err.message);
    dialog.showErrorBox(lang.get.errorTitle, err.message);
    return {};
  }
});

// 添加书签
ipcMain.on('bookmarks-add', (_, name, url, time) => {
  try {
    if (!DataPath.access.W) throw new Error(lang.add.errorInfo);
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    data[time] = { title: name, url: url };
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    debugLog('error', 'Failed to add new bookmark:', err.message);
    dialog.showErrorBox(lang.add.errorTitle, err.message);
  }
});

// 删除书签
ipcMain.on('bookmarks-del', (_, id) => {
  try {
    if (!DataPath.access.W) throw new Error(lang.del.errorInfo);
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    delete data[id];
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    debugLog('error', 'Failed to delete the new bookmark:', err.message);
    dialog.showErrorBox(lang.del.errorTitle, err.message);
  }
});