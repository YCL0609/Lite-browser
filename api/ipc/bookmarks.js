import { DataPath, isDataDirCanRead, isDataDirCanWrite } from '../../lib/config.js';
import { getFile } from '../../lib/getFile.js';
import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
const jsonPath = path.join(DataPath, 'bookmarks.json');
const defaultJson = '{}';

// 获取书签
ipcMain.handle('bookmarks-get', () => {
  if (!isDataDirCanRead || !isDataDirCanWrite) return {};
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
    if (!isDataDirCanWrite) throw new Error('数据目录不可写，无法添加书签');
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
    if (!isDataDirCanWrite) throw new Error('数据目录不可写，无法删除书签');
    const data = JSON.parse(getFile(jsonPath, defaultJson));
    delete data[id];
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签删除错误', err.stack);
  }
});