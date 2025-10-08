const { ipcMain, dialog, shell, BrowserWindow } = require('electron');
const { RandomString, getFile } = require('../../lib/function');
const { DataPath } = require('../../lib/config');
let autoJSCache = {};
const fs = require('fs');
const windowMap = new Map();
const path = require('path');
const defaultJson_name = '{}';
const defaultJson_auto = '{"hosts":[]}';
const targetDir = path.join(DataPath, 'insertjs');
const jsonPath_name = path.join(DataPath, 'insertjs', 'name.json');
const jsonPath_auto = path.join(DataPath, 'insertjs', 'auto.json');


// 窗口注册
ipcMain.on('insertjs-register-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
        windowMap.set(win.id, win); // 保存窗口对象
        win.once('closed', () => windowMap.delete(win.id)) // 窗口销毁时删除保存的对象
    }
});

// 获取脚本列表
ipcMain.handle('insertjs-get-jslist', async () => {
    let json;
    const startat = performance.now();
    try {
        const jsonData = JSON.parse(getFile(jsonPath_name, defaultJson_name));
        json = {
            time: { start: Date.now(), used: performance.now() - startat },
            error: -1,
            list: jsonData
        }
    } catch (err) {
        json = {
            time: { start: Date.now(), used: performance.now() - startat },
            error: err.stack,
            list: []
        }
    }
    return json
});

// 添加脚本
ipcMain.on('insertjs-add-js', async (event) => {
    try {
        const win = BrowserWindow.fromWebContents(event.sender);
        // 打开文件选择对话框
        const result = await dialog.showOpenDialog(win, {
            title: '选择JavaScript文件',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        // 处理用户选择
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, message: '用户取消了选择' };
        }
        for (const sourcePath of result.filePaths) {
            const fileName = path.basename(sourcePath);
            const ext = path.extname(fileName);
            const name = path.basename(fileName, ext);
            const nameID = RandomString();
            const targetPath = path.join(targetDir, nameID + '.js');
            // 复制文件
            try {
                await fs.promises.copyFile(sourcePath, targetPath);
            } catch (err) {
                dialog.showErrorBox('文件复制错误', err.stack);
            }
            // 记录ID和名称对应关系
            try {
                const idJson = JSON.parse(getFile(jsonPath_name, defaultJson_name));
                idJson[nameID] = name;
                fs.writeFileSync(jsonPath_name, JSON.stringify(idJson, null, 2), 'utf-8');
                win.reload();
            } catch (err) {
                dialog.showErrorBox('文件ID记录错误', err.stack);
            }
        }
    } catch (err) {
        dialog.showErrorBox('添加JavaScript文件错误', err.stack);
    }
});

// 删除脚本
ipcMain.on('insertjs-remove-js', async (_, id) => {
    const jsPath = path.join(DataPath, 'insertjs');
    try {
        const filePath = path.join(jsPath, id + '.js');
        await fs.promises.unlink(filePath);
    } catch (err) {
        dialog.showErrorBox('删除JavaScript文件错误', err.stack);
    }
    // 删除ID记录
    try {
        const jsonPath = path.join(jsPath, 'name.json');
        const idJson = JSON.parse(getFile(jsonPath, defaultJson_name));
        delete idJson[id];
        fs.writeFileSync(jsonPath, JSON.stringify(idJson, null, 2), 'utf-8');
    } catch (err) {
        dialog.showErrorBox('删除JavaScript文件ID记录错误', err.stack);
    }
});

// 打开脚本存放目录
ipcMain.on('insertjs-open-dir', async () => {
    const dirpath = path.join(DataPath, 'insertjs')
    try {
        await fs.promises.mkdir(dirpath, { recursive: true });
        shell.openPath(dirpath);
    } catch (err) {
        dialog.showErrorBox('无法打开文件目录\n可尝试手动打开路径' + dirpath, err.stack);
    }
});

// 注入脚本
ipcMain.on('insertjs-insert-js', (event, winid, jsname) => {
    try {
        const mainWindow = BrowserWindow.fromId(winid);
        const filepath = path.join(DataPath, 'insertjs', jsname + '.js');
        const content = fs.readFileSync(filepath, 'utf-8');
        mainWindow.webContents.executeJavaScript(content); // 插入脚本
        // 关闭子窗口
        const childwin = BrowserWindow.fromWebContents(event.sender);
        if (childwin && !childwin.isDestroyed()) childwin.close();
    } catch (err) {
        dialog.showErrorBox('脚本注入错误', err.stack);
    }
});

// 获取当前网址的自动注入脚本列表
ipcMain.handle('insertjs-get-auto-js', (_, winid) => {
    const win = BrowserWindow.fromId(winid);
    const url = new URL(win.webContents.getURL());
    const host = (url.host === '') ? -1 : url.host;
    if (host === -1) {
        dialog.showMessageBox({
            type: 'info',
            title: '当前网址不支持',
            message: '当前网页不支持自动注入脚本\n' + win.webContents.getURL()
        });
        return { errID: -1, hosts: [] };
    };
    const listJson = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
    return { errID: 0, hosts: (listJson.hosts.includes(host)) ? listJson[host] : [] };
});

// 更新当前网址的自动注入脚本列表
ipcMain.on('insertjs-change-auto-js', (_, winid, jsIDs) => {
    const win = BrowserWindow.fromId(winid);
    const url = new URL(win.webContents.getURL());
    const host = (url.host === '') ? -1 : url.host;
    if (host === -1) {
        dialog.showMessageBox({
            type: 'info',
            title: '当前网址不支持',
            message: '当前网页不支持自动注入脚本\n' + win.webContents.getURL()
        });
        return
    };
    // 更新配置文件
    const listJson = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
    if (listJson.hosts.includes(host)) {
        if (jsIDs.length === 0) {
            delete listJson[host];
            listJson.hosts.splice(listJson.hosts.indexOf(host), 1);
        } else {
            listJson[host] = jsIDs;
        }
    } else {
        if (jsIDs.length !== 0) {
            listJson.hosts.push(host);
            listJson[host] = jsIDs;
        }
    }
    fs.writeFileSync(jsonPath_auto, JSON.stringify(listJson, null, 2), 'utf-8');
    autoJSCache = listJson; // 更新缓存
});

// 自动注入脚本
ipcMain.on('insertjs-auto-js-insert', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        // 获取窗口网址
        const urlStr = win.webContents.getURL();
        let urlObj;
        try {
            urlObj = new URL(urlStr);
        } catch (e) {
            dialog.showErrorBox('自动注入脚本错误', urlStr + '\n' + e.stack);
            return;
        }
        // 获取host对应的脚本列表
        const host = (urlObj.host === '') ? -1 : urlObj.host;
        if (host === -1) return;
        if (autoJSCache.hosts === undefined) {
            autoJSCache = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
        }
        let changed = false;
        // 检查文件是否存在，不存在则移除
        if (autoJSCache.hosts.includes(host)) {
            const jsList = autoJSCache[host];
            for (let i = jsList.length - 1; i >= 0; i--) {
                const jsid = jsList[i];
                const filepath = path.join(DataPath, 'insertjs', jsid + '.js');
                if (!fs.existsSync(filepath)) {
                    jsList.splice(i, 1);
                    changed = true;
                }
            }
            // 插入剩余存在的脚本
            for (const jsid of jsList) {
                const filepath = path.join(DataPath, 'insertjs', jsid + '.js');
                const content = fs.readFileSync(filepath, 'utf-8');
                win.webContents.executeJavaScript(content); // 插入脚本
            }
            // 如列表有变更则保存
            if (changed) {
                if (jsList.length === 0) {
                    delete autoJSCache[host];
                    autoJSCache.hosts.splice(autoJSCache.hosts.indexOf(host), 1);
                }
                fs.writeFileSync(path.join(jsonPath_auto, JSON.stringify(autoJSCache, null, 2), 'utf-8'));
            }
        }
    } catch (err) {
        dialog.showErrorBox('自动注入脚本错误', err.stack);
    }
});