const { app, ipcMain, dialog, shell, session, BrowserWindow, Menu, ipcRenderer } = require('electron');
let mainWin = null;
let autoJSCache = {};
const fs = require('fs');
const windowMap = new Map();
const path = require("path");
const MenuList = require('./menu');
const { pathToFileURL } = require('url');
const { error } = require('console');
const gotTheLock = app.requestSingleInstanceLock();
const DataPath = process.env.LITE_BROWSER_DATA_PATH || path.resolve(path.join(__dirname, '..'));
const icon = path.join(__dirname, 'icons', `icon.${(process.platform == 'win32') ? 'ico' : 'png'}`);
const defaultSetting = '{"search":{"id":1,"url":""},"theme":{"color":{"main":"#60eeee","text":"#000000"},"background":null}}';
app.setPath('userData', path.join(DataPath, 'userData')); // 设置缓存路径

if (gotTheLock) {
  app.whenReady().then(() => {
    global.nomenuSession = session.fromPartition('persist:nomenu');
    session.defaultSession.registerPreloadScript({
      type: 'frame',
      filePath: path.join(__dirname, 'html', 'preload.js')
    });
    createMainWindow();
  });

  app.on('window-all-closed', () => app.quit());

  // 处理第二实例
  app.on('second-instance', () => {
    if (mainWin && !mainWin.isDestroyed()) {
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
    } else {
      createMainWindow();
    }
  });
} else {
  // 关闭第二实例
  app.quit();
}

// 主窗口实例
function createMainWindow() {
  mainWin = new BrowserWindow({
    icon: icon,
    width: 1024,
    height: 600,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      session: session.fromPartition('persist:main'),
      contextIsolation: true,
      preload: path.join(__dirname, 'html', 'preload-main.js')
    }
  });
  mainWin.loadFile(path.join(__dirname, 'html', 'index.html'));
  const Menuobj = Menu.buildFromTemplate(MenuList);
  Menu.setApplicationMenu(Menuobj);
  mainWin.on('closed', () => mainWin = null);
}

// 新建窗口事件
ipcMain.on('new-window', (_, url) => {
  const newwin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      session: session.defaultSession,
    },
  });
  newwin.loadURL(url);
});

ipcMain.on('new-window-nomenu', (_, url) => {
  const newwin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      session: session.defaultSession,
    },
  });
  newwin.loadURL(url);
});

// 右键菜单
ipcMain.on('show-context-menu', (_, x, y) => {
  const win = BrowserWindow.getFocusedWindow();
  const Menuobj = Menu.buildFromTemplate([...MenuList, {
    label: '关闭菜单栏',
    click: () => win.setMenu(null)
  }, {
    label: '关闭右键菜单', click: () => win.webContents.executeJavaScript('window.litebrowser.disableContextMenu()')
  }]);
  Menuobj.popup({ window: win, x, y })
});

// 书签事件
ipcMain.handle('bookmarks-get', (event) => (event.sender.id == 1) ? getJson('bookmarks.json', '书签文件读取错误') : null);

ipcMain.on('bookmarks-add', (event, name, url, time) => {
  if (event.sender.id != 1) return; // 判断是否为主页面
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    data[time] = { title: name, url: url };
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack);
  }
});

ipcMain.on('bookmarks-del', (event, id) => {
  if (event.sender.id != 1) return; // 判断是否为主页面
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    delete data[id];
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签删除错误', err.stack);
  }
});

// JS插入事件
ipcMain.on('insertjs-register-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    windowMap.set(win.id, win); // 保存窗口对象
    win.once('closed', () => windowMap.delete(win.id)) // 窗口销毁时删除保存的对象
  }
});

ipcMain.handle('insertjs-get-jslist', async () => {
  let json;
  fs.mkdirSync(path.join(DataPath, 'insertjs'), { recursive: true });
  const startat = performance.now();
  try {
    const jsonData = JSON.parse(getJson(path.join('insertjs', 'name.json'), '名称ID文件读取错误'));
    json = {
      time: { start: Date.now(), used: performance.now() - startat },
      error: -1,
      list: jsonData
    }
  } catch (error) {
    json = {
      time: { start: Date.now(), used: performance.now() - startat },
      error: error.stack,
      list: []
    }
  }
  return json
});

ipcMain.on('insertjs-add-js', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const targetDir = path.join(DataPath, 'insertjs');
    // 文件处理
    const result = await dialog.showOpenDialog(win, {
      title: '选择JavaScript文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'JavaScript', extensions: ['js'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
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
        const idJson = JSON.parse(getJson(path.join('insertjs', 'name.json'), '名称ID文件读取错误'));
        idJson[nameID] = name;
        fs.writeFileSync(path.join(targetDir, 'name.json'), JSON.stringify(idJson, null, 2), 'utf-8');
        win.reload();
      } catch (err) {
        dialog.showErrorBox('文件ID记录错误', err.stack);
      }
    }
  } catch (err) {
    dialog.showErrorBox('添加JavaScript文件错误', err.stack);
  }
});

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
    const idJson = JSON.parse(getJson(path.join('insertjs', 'name.json'), '名称ID文件读取错误'));
    delete idJson[id];
    fs.writeFileSync(path.join(jsPath, 'name.json'), JSON.stringify(idJson, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('删除JavaScript文件ID记录错误', err.stack);
  }
});

ipcMain.on('insertjs-open-dir', async () => {
  const dirpath = path.join(DataPath, 'insertjs')
  try {
    await fs.promises.mkdir(dirpath, { recursive: true });
    shell.openPath(dirpath);
  } catch (err) {
    dialog.showErrorBox('无法打开文件目录\n可尝试手动打开路径' + dirpath, err.stack);
  }
});

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
  const listJson = JSON.parse(getJson(path.join('insertjs', 'auto.json'), '自动注入配置文件读取错误', '{"hosts":[]}'));
  return { errID: 0, hosts: (listJson.hosts.includes(host)) ? listJson[host] : [] };
});

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
  const listJson = JSON.parse(getJson(path.join('insertjs', 'auto.json'), '自动注入配置文件读取错误', '{"hosts":[]}'));
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
  fs.writeFileSync(path.join(DataPath, 'insertjs', 'auto.json'), JSON.stringify(listJson, null, 2), 'utf-8');
  autoJSCache = listJson; // 更新缓存
});

ipcMain.on('insertjs-auto-js-insert', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    const urlStr = win.webContents.getURL();
    const urlObj = new URL(urlStr);
    const host = (urlObj.host === '') ? -1 : urlObj.host;
    if (host === -1) return;
    if (autoJSCache.hosts === undefined) {
      autoJSCache = JSON.parse(getJson(path.join('insertjs', 'auto.json'), '自动注入配置文件读取错误', '{"hosts":[]}'));
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
        fs.writeFileSync(path.join(DataPath, 'insertjs', 'auto.json'), JSON.stringify(autoJSCache, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    dialog.showErrorBox('自动注入脚本错误', err.stack);
  }
});

// 主页面设置
ipcMain.handle('setting-get', (event, isimg) => {
  if (event.sender.id != 1) return; // 判断是否为主页面
  const data = getJson('setting.json', '配置文件读取错误', defaultSetting);
  if (!isimg) return data;
  const filePath = path.join(DataPath, JSON.parse(data).theme.background)
  return pathToFileURL(filePath).href;
});

ipcMain.on('setting-change', (event, json) => {
  if (event.sender.id != 1) return; // 判断是否为主页面
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

ipcMain.on('setting-change-image', async (event, type, base64) => {
  if (event.sender.id != 1) return; // 判断是否为主页面
  try {
    const mime = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/x-icon': 'ico',
      'image/avif': 'avif',
      'image/apng': 'apng',
      'image/heic': 'heic',
      'image/heif': 'heif',
      'image/x-xbitmap': 'xbm'
    };
    const extension = mime[type];
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

// 获取JSON文件内容
function getJson(name, errtext, defaultdata = '{}') {
  const filePath = path.join(DataPath, name)
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8')
    } else {
      fs.writeFileSync(filePath, defaultdata);
      return defaultdata
    }
  } catch (err) {
    dialog.showErrorBox(errtext, err.stack)
    throw err
  }
}

// 生成随机字符串
function RandomString(length = 32) {
  const characters = 'abcdefghijklmnopqrestuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}