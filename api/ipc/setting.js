import { DataPath, defaultSetting, imageMIME, isDataDirCanRead, isDataDirCanWrite } from '../../libs/config.js';
import { getFile, getLocale } from '../../libs/functions.js';
import { ipcMain, dialog } from 'electron';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const jsonPath = path.join(DataPath, 'setting.json');
const langraw = getLocale();
const lang = langraw.ipc.setting;

// 获取配置
ipcMain.handle('setting-get', (_, isimg) => {
    if (!isDataDirCanRead || !isDataDirCanWrite) return JSON.stringify(defaultSetting);
    const data = getFile(jsonPath, JSON.stringify(defaultSetting));
    if (!isimg) return data;
    const filePath = path.join(DataPath, JSON.parse(data).theme.background)
    return pathToFileURL(filePath).href;
});

// 修改配置
ipcMain.on('setting-change', (_, json) => {
    if (!isDataDirCanWrite) return;
    try {
        const data = JSON.parse(getFile(jsonPath, JSON.stringify(defaultSetting)));
        const colon = (data.theme.background == null) ? '' : '"';
        const bgname = colon + data.theme.background + colon;
        const setting = json.replace(/@bgpic@/g, bgname);
        fs.writeFileSync(jsonPath, setting);
    } catch (err) {
        dialog.showErrorBox(lang.change.errorTitle, err.stack)
    }
});

// 修改背景图片
ipcMain.on('setting-change-image', async (_, type, base64) => {
    if (!isDataDirCanWrite) return;
    try {
        const extension = imageMIME[type];
        if (!extension) throw new Error(lang.changeImg.unknowMIME + mimeType);
        const buffer = Buffer.from(base64, 'base64');
        const output = `background.${extension}`
        fs.writeFileSync(path.join(DataPath, output), buffer);
        // 更新配置文件
        const json = JSON.parse(getFile(jsonPath, JSON.stringify(defaultSetting)));
        if (json.theme.background != null) {
            try {
                fs.unlinkSync(path.join(DataPath, json.theme.background))
            } catch (err) {
                dialog.showMessageBox({
                    type: 'warning',
                    title: lang.changeImg.title,
                    message: lang.changeImg.message + path.join(DataPath, json.theme.background),
                    defaultId: 0,
                    cancelId: 0,
                    buttons: [langraw.public.OKBtn, langraw.public.details]
                }).then(cho => { if (cho == 1) dialog.showErrorBox(err.stack) })
            }
        }
        json.theme.background = output
        fs.writeFileSync(jsonPath, JSON.stringify(json));
    } catch (err) {
        dialog.showErrorBox(lang.changeImg.errorTitle, err.stack);
    }
})