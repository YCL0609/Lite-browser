import { appPath, iconPath, supportLang, isDebug, ToolsID } from '../lib/config.js';
import { BrowserWindow, dialog, app, Menu, session } from 'electron';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

// 调试菜单
const debugMenu = isDebug ? Menu.buildFromTemplate([
  { label: '忽略缓存刷新(ForceReload)', accelerator: 'Shift+F5', role: 'forceReload' },
  { label: '开发者工具(DevTools)', accelerator: 'F12', role: 'toggleDevTools' },
]) : null;

// 无菜单Session
let _nomenuSession = null;
function getNomenuSession() {
  return _nomenuSession ??= session.fromPartition('persist:nomenu');
}

// 命令行参数处理
function cmdLineHandle(params, callback) {
  const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
  const Urls = [];
  const Tools = [];

  for (const arg of params) {
    // 提取URL
    if (urlRegex.test(arg)) Urls.push(arg);
    // 小工具参数
    if (ToolsID.includes(arg.slice(2))) {
      if (!Tools.includes(arg.slice(2))) Tools.push(arg.slice(2));
    }
  }

  if (Urls.length === 0 && Tools.length === 0) {
    // 无特殊参数时正常启动
    if (typeof callback === 'function') callback();
  } else {
    // 打开对应页面
    Promise.all([
      Urls.forEach(url => new BrowserWindow({
        width: 800, height: 600, icon: iconPath,
        webPreferences: {
          sandbox: true,
          spellcheck: false,
          webSecurity: true,
          nodeIntegration: false,
          contextIsolation: true,
          session: session.defaultSession
        }
      }).loadURL(url)),
      Tools.forEach(tool => openToolsWindow(tool + '.html'))
    ])
  }
}

// 打开工具窗口
function openToolsWindow(htmlfile) {
  const newwin = new BrowserWindow({
    width: 1024,
    height: 600,
    icon: iconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: getNomenuSession(),
      preload: path.join(appPath, 'api', 'preload', 'tools.js')
    }
  });
  newwin.setMenu(debugMenu);
  newwin.loadURL(pathToFileURL(path.join(appPath, 'html', 'tools', htmlfile)).href);
}

// 插入js
function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript('litebrowser.registerWindow()');
  const childWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 500,
    icon: iconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: getNomenuSession(),
      preload: path.join(appPath, 'api', 'preload', 'insertjs.js'),
      additionalArguments: [`--parent-window-id=${mainWindow.id}`]
    }
  });
  childWindow.setMenu(debugMenu);
  childWindow.loadFile(path.join(appPath, 'html', 'insert', 'index.html'));
}

// 获取文件内容
function getFile(filePath, defaultData = '') {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // 创建多级目录
    }
    fs.writeFileSync(filePath, defaultData);
    return defaultData;
  }
}

// 加载语言文件
let localejson = null;
function getLocale() {
  if (localejson !== null) return localejson;
  const preferredLangs = app.getPreferredSystemLanguages();
  const topLocale = (preferredLangs[0] || 'en').split('-')[0];
  const cmdLocale = process.env.LITE_BROWSER_LANG;
  const usrlocale = supportLang.includes(topLocale) ? topLocale : 'en';
  const locale = supportLang.includes(cmdLocale) ? cmdLocale : usrlocale;

  let rawjson;
  try {
    // 尝试加载对应语言文件
    rawjson = fs.readFileSync(path.join(appPath, 'lang', `${locale}.json`), 'utf-8');
  } catch (err0) {
    // 首选语言不可用
    console.error(err0.stack);
    app.whenReady().then(() => {
      dialog.showMessageBox({
        type: 'warning',
        title: 'Not use localization language',
        message: `Unable to load localization language file ${locale}.json, using default language instead.`,
        buttons: ['Confirm', 'Details'],
        defaultId: 0,
        cancelId: 0
      }).then(cho => { if (cho == 1) dialog.showErrorBox('Error Details', err0.stack) })
    })
    // 加载默认语言文件
    try {
      rawjson = fs.readFileSync(path.join(appPath, 'lang', 'en.json'), 'utf-8');
    } catch (err) {
      console.error(err.stack)
      dialog.showErrorBox('Fatal Error: Language file missing', 'Unable to load default localization language file en.json. The application will exit.\n\n' + err.stack);
      process.exit(1);
    }
  }

  localejson = JSON.parse(rawjson);
  return JSON.parse(rawjson);
}

export {
  getFile,
  insertJS,
  getLocale,
  cmdLineHandle,
  openToolsWindow,
  getNomenuSession,
};