const { app, ipcMain, dialog, shell, session, BrowserWindow, Menu, ipcRenderer } = require('electron');
const fs = require('fs');
const windowMap = new Map();
const path = require("path");
const MenuList = require('./menu');
const { pathToFileURL } = require('url')
const Menuobj = Menu.buildFromTemplate(MenuList);
const DataPath = process.env.LITE_BROWSER_DATA_PATH || path.join(__dirname, 'resources',);
app.setPath('userData', path.join(DataPath, 'userData'));

app.whenReady().then(() => {
  global.insertSession = session.fromPartition('persist:jsinsert');
  session.defaultSession.setPreloads([path.join(__dirname, 'html', 'preload.js')])
  const win = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'html', 'preload-main.js')
    }
  });
  win.loadFile(path.join(__dirname, 'html', 'index.html'));
  Menu.setApplicationMenu(Menuobj);
});

app.on('window-all-closed', () => app.quit());

ipcMain.on('show-context-menu', (x, y) => Menuobj.popup({ window: BrowserWindow.getFocusedWindow(), x, y }));

// 书签事件
ipcMain.handle('bookmarks-get', () => getJson('bookmarks.json', '书签文件读取错误'));

ipcMain.on('bookmarks-add', (_, name, url, time) => {
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    data[time] = { title: name, url: url };
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack);
  }
});

ipcMain.on('bookmarks-del', (_, id) => {
  try {
    const data = JSON.parse(getJson('bookmarks.json', '书签文件读取错误'));
    delete data[id];
    fs.writeFileSync(path.join(DataPath, 'bookmarks.json'), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    dialog.showErrorBox('书签删除错误', err.stack);
  }
});

// JS插入事件
/**绑定请求过多，可能内存泄漏**//////////////////////////////////////////////////
ipcMain.on('insertjs-register-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    windowMap.set(win.id, win);
    win.on('closed', () => windowMap.delete(win.id))
  }
});

ipcMain.handle('insertjs-get-jslist', async () => {
  let json;
  const startat = performance.now();
  try {
    const dir = path.join(DataPath, 'insertjs');
    await fs.promises.mkdir(dir, { recursive: true });
    const files = await fs.promises.readdir(dir);
    const statsPromises = files.map(file => fs.promises.stat(path.join(dir, file)));
    const stats = await Promise.all(statsPromises);
    const list = files.map((file, index) => {
      const stat = stats[index];
      if (!stat.isDirectory() && path.extname(file).toLowerCase() === ".js") {
        return {
          name: file,
          time: stat.mtime.getTime()
        };
      }
      return null;
    }).filter(Boolean);
    json = {
      time: { start: Date.now(), used: performance.now() - startat },
      error: -1,
      list: list
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
    const copiedFiles = [];
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
      const targetPath = path.join(targetDir, fileName);
      try {
        // 检查文件是否已存在
        try {
          await fs.promises.access(targetPath);
          // 文件已存在，添加时间戳避免覆盖
          const ext = path.extname(fileName);
          const name = path.basename(fileName, ext);
          const timestamp = Date.now();
          const newFileName = `${name}_${timestamp}${ext}`;
          const newTargetPath = path.join(targetDir, newFileName);
          await fs.promises.copyFile(sourcePath, newTargetPath);
          copiedFiles.push(newFileName);
        } catch {
          // 文件不存在，直接复制
          await fs.promises.copyFile(sourcePath, targetPath);
          copiedFiles.push(fileName);
        }
      } catch (err) {
        dialog.showErrorBox('文件复制错误', err.stack);
      }
    }
    win.reload();
  } catch (err) {
    dialog.showErrorBox('添加JavaScript文件错误', err.stack);
  }
});

ipcMain.on('insertjs-remove-js', async (event, name) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    const jsPath = path.join(DataPath, 'insertjs');
    const filePath = path.join(jsPath, name);
    await fs.promises.unlink(filePath);
    win.reload();
  } catch (err) {
    dialog.showErrorBox('删除JavaScript文件错误', err.stack);
  }
});

ipcMain.on('insertjs-open-dir', async () => {
  try {
    const dirpath = path.join(DataPath, 'insertjs')
    await fs.promises.mkdir(dirpath, { recursive: true });
    shell.openPath(dirpath)
  } catch (err) {
    dialog.showErrorBox('打开文件目录错误', err.stack);
  }
});

ipcMain.on('insertjs-insert-js', (event, winid, jsname) => {
  try {
    const mainWindow = BrowserWindow.fromId(winid);
    const childwin = BrowserWindow.fromWebContents(event.sender);
    const filepath = path.join(DataPath, 'insertjs', jsname)
    const content = fs.readFileSync(filepath, 'utf-8');
    mainWindow.webContents.executeJavaScript(content);
    childwin.close();
  } catch (err) {
    dialog.showErrorBox('脚本注入错误', err.stack);
  }
})

// 主页面设置
ipcMain.handle('setting-get', (_, isimg) => {
  const data = getJson('setting.json', '配置文件读取错误', true);
  if (!isimg) return data;
  const filePath = path.join(DataPath, JSON.parse(data).theme.background)
  return pathToFileURL(filePath).href;
});

ipcMain.on('setting-change', (_, json) => {
  try {
    const data = JSON.parse(getJson('setting.json', '配置文件读取错误', true));
    const colon = (data.theme.background == null) ? '' : '"';
    const bgname = colon + data.theme.background + colon;
    const setting = json.replace(/@@/g, bgname);
    fs.writeFileSync(path.join(DataPath, 'setting.json'), setting);
  } catch (err) {
    dialog.showErrorBox('配置修改错误', err.stack)
  }
});

ipcMain.on('setting-change-image', async (_, type, base64) => {
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
    const json = JSON.parse(getJson('setting.json', '配置文件读取错误', true));
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

function getJson(name, errtext, issetting = false) {
  const filePath = path.join(DataPath, name)
  const defaultdata = issetting ? `{"search":{"id":1,"url":""},"theme":{"color":{"main":"#60eeee","text":"#000000"},"background":null}}` : '{}';
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