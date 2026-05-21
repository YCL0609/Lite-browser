import { debugLog, getFile, getLocale, DataPath, defaultSetting } from '../../core/index.js';
import { ipcMain, dialog } from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const jsonPath = path.join(DataPath.basic, 'settings.json');
const langraw = getLocale();
const lang = langraw.ipc.setting;
const imageMIME = { // 支持的图片MIME类型
    'image/gif': 'gif',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/apng': 'apng',
    'image/svg+xml': 'svg'
};

// 获取配置
ipcMain.handle('setting-get', (_, isimg) => {
    if (!DataPath.access.RW) return JSON.stringify(defaultSetting);
    const data = getFile(jsonPath, JSON.stringify(defaultSetting));
    if (!isimg) return data;
    const filePath = path.join(DataPath, JSON.parse(data).theme.background)
    return pathToFileURL(filePath).href;
});

// 修改配置
ipcMain.on('setting-change', (_, json) => {
    if (!DataPath.access.W) return;
    try {
        const data = JSON.parse(getFile(jsonPath, JSON.stringify(defaultSetting)));
        const bg = data.mainWin.theme.background;
        data.mainWin = json.replace(/@bgpic@/g, bg !== null ? `"${bg}"` : null)
        fs.writeFileSync(jsonPath, data);
    } catch (err) {
        debugLog('error', 'Failed to change settings:', err.message);
        dialog.showErrorBox(lang.change.errorTitle, err.message);
    }
});

// 修改背景图片
ipcMain.on('setting-change-image', async (_, type, base64) => {
    if (!DataPath.access.W) return;
    try {
        const extension = imageMIME[type];
        if (!extension) throw new Error(lang.changeImg.unknowMIME + mimeType);
        const buffer = Buffer.from(base64, 'base64');
        const output = `background.${extension}`
        fs.writeFileSync(path.join(DataPath, output), buffer);
        // 更新配置文件
        const json = JSON.parse(getFile(jsonPath, JSON.stringify(defaultSetting)));
        if (json.mainWin.theme.background != null) {
            try {
                fs.unlinkSync(path.join(DataPath, json.mainWin.theme.background));
            } catch (err) {
                debugLog('error', 'Failed to delete background image file:', err.message);
                dialog.showMessageBox({
                    type: 'warning',
                    title: lang.changeImg.title,
                    message: lang.changeImg.message + path.join(DataPath, json.mainWin.theme.background),
                    defaultId: 0,
                    cancelId: 0,
                    buttons: [langraw.public.OKBtn, langraw.public.details]
                }).then(cho => { if (cho == 1) dialog.showErrorBox(err.stack) })
            }
        }
        json.mainWin.theme.background = output
        fs.writeFileSync(jsonPath, JSON.stringify(json));
    } catch (err) {
        debugLog('error', 'Failed to change background image setting:', err.message);
        dialog.showErrorBox(lang.changeImg.errorTitle, err.stack);
    }
})