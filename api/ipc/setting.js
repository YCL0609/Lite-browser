import { debugLog, getFile, getLocale, DataPath, defaultSetting, jsonCheck, openSettings } from '../../core/index.js';
import { ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
const jsonPath = path.join(DataPath.basic, 'settings.json');
const langraw = getLocale();
const lang = langraw.ipc.setting;
const defaultFileStr = JSON.stringify(defaultSetting);
let currentImgName = '';

// 打开配置页面
ipcMain.on('settings-open-windows', openSettings);

// 获取配置
ipcMain.handle('settings-get', () => {
    if (!DataPath.access.RW) return defaultCfg;
    try {
        const dataRaw = JSON.parse(getFile(jsonPath, defaultFileStr));
        const data = jsonCheck(dataRaw, defaultSetting)
        currentImgName = data.mainWin.background;
        return data;
    } catch (err) {
        debugLog('error', 'Failed to get settings:', err.message);
        dialog.showErrorBox(lang.get, err.message);
    }
});

// 修改配置
ipcMain.on('settings-set', (_, data) => {
    if (!DataPath.access.W || !data) return;
    try {
        const json = jsonCheck(data, defaultSetting);
        fs.writeFileSync(jsonPath, JSON.stringify(json));
        if (currentImgName !== '' && json.mainWin.background !== currentImgName) {
            fs.unlinkSync(path.join(DataPath.basic, currentImgName));
            currentImgName = json.mainWin.background;
        }
        dialog.showMessageBox({
            type: 'info',
            title: 'Lite Browser',
            message: lang.message,
            buttons: ['OK'],
        })
    } catch (err) {
        debugLog('error', 'Failed to set settings:', err.message);
        dialog.showErrorBox(lang.set, err.message);
    }
});