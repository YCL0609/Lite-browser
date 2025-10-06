const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { getJson } = require('../../lib/function');
const { DataPath, defaultSetting, imageMIME } = require('../../lib/config');

// 获取配置
ipcMain.handle('setting-get', (_, isimg) => {
    const data = getJson('setting.json', '配置文件读取错误', defaultSetting);
    if (!isimg) return data;
    const filePath = path.join(DataPath, JSON.parse(data).theme.background)
    return pathToFileURL(filePath).href;
});

// 修改配置
ipcMain.on('setting-change', (_, json) => {
    try {
        const data = JSON.parse(getJson('setting.json', '配置文件读取错误', defaultSetting));
        const colon = (data.theme.background == null) ? '' : '"';
        const bgname = colon + data.theme.background + colon;
        const setting = json.replace(/@@/g, bgname);
        fs.writeFileSync(path.join(DataPath, 'setting.json'), setting);
    } catch (err) {
        dialog.showErrorBox('配置修改错误', err.stack)
    }
});

// 修改背景图片
ipcMain.on('setting-change-image', async (_, type, base64) => {
    try {
        const extension = imageMIME[type];
        if (!extension) throw new Error('未知MIME类型: ' + mimeType);
        const buffer = Buffer.from(base64, 'base64');
        const output = `background.${extension}`
        fs.writeFileSync(path.join(DataPath, output), buffer);
        // 更新配置文件
        const json = JSON.parse(getJson('setting.json', '配置文件读取错误', defaultSetting));
        if (json.theme.background != null) {
            try {
                fs.unlinkSync(path.join(DataPath, json.theme.background))
            } catch (err) {
                dialog.showMessageBox({
                    type: 'warning',
                    title: '旧图片删除警告',
                    message: '旧图片删除失败, 可尝试手动删除\n文件路径:' + path.join(DataPath, json.theme.background),
                    defaultId: 0,
                    cancelId: 0,
                    buttons: ['确定', '详细信息']
                })
                    .then(cho => {
                        if (cho.response == 1) {
                            dialog.showMessageBox({
                                type: 'info',
                                title: '详细信息',
                                message: err.stack
                            })
                        }
                    })
            }
        }
        json.theme.background = output
        fs.writeFileSync(path.join(DataPath, 'setting.json'), JSON.stringify(json));
    } catch (err) {
        dialog.showErrorBox('图片保存错误', err.stack);
    }
})
