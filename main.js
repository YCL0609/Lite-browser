const { app, ipcMain, dialog, shell, session, BrowserWindow, Menu } = require('electron');
const fs = require('fs');
const windowMap = new Map();
const path = require("path");
const MenuList = require('./menu');
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
  })
  win.loadFile(path.join(__dirname, 'html', 'index.html'));
  Menu.setApplicationMenu(Menuobj);
});

app.on('window-all-closed', () => app.quit());

ipcMain.on('show-context-menu', (x, y) => Menuobj.popup({ window: BrowserWindow.getFocusedWindow(), x, y }));



// 书签事件
ipcMain.handle('bookmarks-get', () => {
  const filePath = path.join(DataPath, 'bookmarks.json')
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8')
    } else {
      fs.writeFileSync(filePath, '{}');
      return "{}"
    }
  } catch (err) {
    dialog.showErrorBox('读取书签错误', err.stack)
  }
});

// JS插入事件
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

ipcMain.on('insertjs-insert-js', async (event, winid, jsname) => {
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