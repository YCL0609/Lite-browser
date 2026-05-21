import { debugLog, getFile, getLocale, DataPath } from '../../core/index.js';
import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
const jsonPath_name = path.join(DataPath.insertjs, 'name.json');
const jsonPath_auto = path.join(DataPath.insertjs, 'auto.json');
const defaultJson_auto = '{"hosts":[]}';
const defaultJson_name = '{}';
const windowMap = new Map();
let autoJSCache = null;

const langRaw = getLocale();
const lang = langRaw.ipc.insertjs;

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
    if (!DataPath.access.R) return { used: 0, error: lang.get.errorInfo, list: [] };
    let json;
    const startat = performance.now();
    try {
        const jsonData = JSON.parse(getFile(jsonPath_name, defaultJson_name));
        json = {
            used: performance.now() - startat,
            error: -1,
            list: jsonData
        }
    } catch (err) {
        json = {
            used: performance.now() - startat,
            error: err.stack,
            list: []
        }
    }

    debugLog(json.error === -1 ? 'info' : 'warn', 'Get list of inserted JS files: Used:', json.used, 'Length:', json.list.length)
    return json
});

// 添加脚本
ipcMain.on('insertjs-add-js', async (event) => {
    try {
        if (!DataPath.access.W) throw new Error(lang.add.errorInfo);
        const win = BrowserWindow.fromWebContents(event.sender);
        // 打开文件选择对话框
        const result = await dialog.showOpenDialog(win, {
            title: lang.add.title,
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JavaScript', extensions: ['js'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        // 处理用户选择
        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, message: lang.add.userCancel };
        }
        for (const sourcePath of result.filePaths) {
            const fileName = path.basename(sourcePath);
            const ext = path.extname(fileName);
            const name = path.basename(fileName, ext);
            const nameID = crypto.randomUUID();
            const targetPath = path.join(DataPath.insertjs, nameID + '.js');
            // 复制文件
            try {
                await fs.promises.copyFile(sourcePath, targetPath);
            } catch (err) {
                debugLog('error', `Failed to copy JS file ${sourcePath}:`, err.message);
                dialog.showErrorBox(lang.add.copyError, err.message);
                return;
            }
            // 记录ID和名称对应关系
            try {
                const idJson = JSON.parse(getFile(jsonPath_name, defaultJson_name));
                idJson[nameID] = name;
                fs.writeFileSync(jsonPath_name, JSON.stringify(idJson, null, 2), 'utf-8');
                win.reload();
            } catch (err) {
                debugLog('error', 'Record ID mapping error:', err.message);
                dialog.showErrorBox(lang.add.IDError, err.message);
            }
        }
    } catch (err) {
        debugLog('error', 'Add new entry error:', err.message);
        dialog.showErrorBox(lang.add.errorTitle, err.message);
    }
});

// 重命名脚本
ipcMain.on('insertjs-rename-js', (_, jsID, newName) => {
    try {
        if (!DataPath.access.RW) throw new Error(lang.rename.errorInfo);
        // 更新配置文件
        const listJson = JSON.parse(getFile(jsonPath_name, defaultJson_name));
        listJson[jsID] = newName;
        fs.writeFileSync(jsonPath_name, JSON.stringify(listJson, null, 2), 'utf-8');
    } catch (err) {
        debugLog('error', 'Rename entry error:', err.message);
        dialog.showErrorBox(lang.rename.errorTitle, err.message);
    }
})

// 删除脚本
ipcMain.on('insertjs-remove-js', (_, jsIDs) => {
    const jsPath = path.join(DataPath, 'insertjs');
    // 删除文件
    try {
        if (!DataPath.access.W) throw new Error(lang.remove.errorInfo)
        jsIDs.forEach(async (id) => {
            await fs.promises.unlink(path.join(jsPath, id + '.js'))
        })
    } catch (err) {
        debugLog('error', 'Failed to delete JS file:', err.message);
        dialog.showErrorBox(lang.remove.fileErrorTitle, err.message);
        return;
    }
    // 删除ID记录
    try {
        const jsonPath = path.join(jsPath, 'name.json');
        const idJson = JSON.parse(getFile(jsonPath, defaultJson_name));
        jsIDs.forEach(id => delete idJson[id]);
        fs.writeFileSync(jsonPath, JSON.stringify(idJson, null, 2), 'utf-8');
    } catch (err) {
        debugLog('error', 'Error deleting mapping record:', err.message);
        dialog.showErrorBox(lang.remove.IDErrorTitle, err.message);
    }
});

// 打开脚本存放目录
ipcMain.on('insertjs-open-dir', async () => {
    const dirpath = path.join(DataPath, 'insertjs')
    try {
        await fs.promises.mkdir(dirpath, { recursive: true });
        shell.openPath(dirpath);
    } catch (err) {
        debugLog('warn', 'Can not open dir out side app:', dirpath);
        dialog.showErrorBox(lang.opendir.errorTitle + dirpath, err.message);
    }
});

// 注入脚本
ipcMain.on('insertjs-insert-js', (event, winid, jsIDs) => {
    try {
        if (!DataPath.access.R) throw new Error(lang.insert.errorInfo);
        const mainWindow = BrowserWindow.fromId(winid);
        jsIDs.forEach(id => {
            const filepath = path.join(DataPath, 'insertjs', id + '.js');
            const content = fs.readFileSync(filepath, 'utf-8');
            mainWindow.webContents.executeJavaScript(content); // 插入脚本
        });
        // 关闭子窗口
        const childwin = BrowserWindow.fromWebContents(event.sender);
        if (childwin && !childwin.isDestroyed()) childwin.close();
    } catch (err) {
        debugLog('error', 'Script injection error:', err.message);
        dialog.showErrorBox(lang.insert.errorTitle, err.message);
    }
});

// 获取当前网址的自动注入脚本列表
ipcMain.handle('insertjs-get-auto-js', (_, winid) => {
    if (!DataPath.access.R) return { errID: -1, hosts: [] };
    const win = BrowserWindow.fromId(winid);
    const url = new URL(win.webContents.getURL());
    if (url.host === '') return { errID: -1, hosts: [] };
    const listJson = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
    return { errID: 0, hosts: (listJson.hosts.includes(url.host)) ? listJson[url.host] : [] };
});

// 更新当前网址的自动注入脚本列表
ipcMain.on('insertjs-change-auto-js', (_, winid, jsIDs) => {
    try {
        if (!DataPath.access.RW) throw new Error(lang.changeAuto.errorInfo)
        const win = BrowserWindow.fromId(winid);
        const url = new URL(win.webContents.getURL());
        if (url.host === '') return;
        // 更新配置文件
        if (autoJSCache == null) autoJSCache = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
        if (autoJSCache.hosts.includes(url.host)) {
            if (jsIDs.length === 0) {
                delete autoJSCache[url.host];
                autoJSCache.hosts.splice(autoJSCache.hosts.indexOf(url.host), 1);
            } else {
                autoJSCache[url.host] = jsIDs;
            }
        } else {
            if (jsIDs.length !== 0) {
                autoJSCache.hosts.push(url.host);
                autoJSCache[url.host] = jsIDs;
            }
        }
        fs.writeFileSync(jsonPath_auto, JSON.stringify(autoJSCache, null, 2), 'utf-8');
    } catch (err) {
        debugLog('error', 'Error modifying the automatic injection list:', err.message);
        dialog.showErrorBox(lang.changeAuto.errorTitle, err.message);
    }
});

// 自动注入脚本
ipcMain.on('insertjs-auto-js-insert', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    try {
        if (!DataPath.access.R) throw new Error(lang.autoInsert.errorInfo);
        // 获取窗口网址
        const urlStr = win.webContents.getURL();
        const urlObj = new URL(urlStr);
        // 获取host对应的脚本列表
        const host = (urlObj.host === '') ? -1 : urlObj.host;
        if (host === -1) return;
        autoJSCache ??= JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
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
                fs.writeFileSync(jsonPath_auto, JSON.stringify(autoJSCache, null, 2), 'utf-8');
            }
        }
    } catch (err) {
        debugLog('error', 'Auto script injection error:', err.message);
        dialog.showErrorBox(lang.autoInsert.errorTitle, err.message);
    }
});