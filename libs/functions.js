import { AppPath, IconPath, supportLang, isDebug, toolsID, isTrace, DataPath, isLog, defaultSetting } from '../libs/config.js';
import { BrowserWindow, dialog, app, Menu, session } from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

/**************** 调试相关 ****************/

/**
 * 调试模式额外菜单项目 (仅在 `isDebug` 为真时创建)
 * @type {Electron.Menu|null}
 */
const debugMenu = isDebug ? Menu.buildFromTemplate([
  { label: '忽略缓存刷新(ForceReload)', accelerator: 'Shift+F5', role: 'forceReload' },
  { label: '开发者工具(DevTools)', accelerator: 'F12', role: 'toggleDevTools' },
]) : null;

const _useColor = process.stdout.isTTY && process.stdout.getColorDepth() > 1 && !process.env.NO_COLOR;
const _levelTable = {
  table: { txt: '', color: '', stderr: false },
  info: { txt: '[INFO]', color: '\x1b[36m', stderr: false },
  warn: { txt: '[WARN]', color: '\x1b[33m', stderr: true },
  error: { txt: '[ERROR]', color: '\x1b[31m', stderr: true },
};
/**
 * 打印调试日志 (仅在 `isDebug` 为真时输出)
 *  - `info` 级别输出到`stdout`，`warn`和`error`级别输出到`stderr`
 *  - 当 `isTrace` 为真时，`warn` 和 `error` 级别会附加调用栈跟踪信息
 * @param {'table'|'info'|'warn'|'error'} level - 日志级别，支持 'table'|'info'|'warn'|'error'
 * @param {...any} args - 要输出的任意数量的参数，会附加对应级别的标签在前面
 * @returns {void}
 */
function debugLog(level, ...args) {
  if (!isLog) return;
  const detail = _levelTable[level.trim().toLowerCase()];
  if (!detail) return;
  const color = _useColor ? detail.color : ''

  if (detail.stderr) {
    if (isTrace) {
      console.trace(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
    } else {
      console.warn(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
    }
  } else if (level === 'table') {
    console.table(...args)
  } else {
    console.log(color, detail.txt, ...args, _useColor ? '\x1b[0m' : '');
  }
}

/**************** 程序基础 ****************/

/**
 * 处理命令行参数，支持直接打开 URL 和打开内置小工具
 * - 识别以 http(s):// 开头的 URL 并在新窗口中打开
 * - 识别以 `--<toolID>` 形式的小工具 id 并打开对应工具窗口
 * @param {string[]} [params=[]] - 命令行参数数组
 * @param {Function} [callback] - 当未检测到特殊参数时要调用的回调函数
 * @returns {void}
 */
function cmdLineHandle(params = [], callback) {
  const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
  const Urls = [];
  const Tools = [];
  debugLog('info', 'Command Line Parameters:', ...params);

  for (const arg of params) {
    // 提取URL
    if (urlRegex.test(arg)) Urls.push(arg);
    // 小工具参数
    const tool = arg.slice(2); // 去掉前缀 "--"
    if (toolsID.includes(tool) && !Tools.includes(tool)) {
      Tools.push(tool);
    }
  }

  if (Urls.length === 0 && Tools.length === 0) {
    // 无特殊参数时正常启动
    if (typeof callback === 'function') callback();
  } else {
    // 打开对应页面
    Promise.all([
      Urls.forEach(url => new BrowserWindow({
        width: 800, height: 600, icon: IconPath,
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

let _localejson = null;
/**
 * 加载并返回本地化语言 JSON 对象 (缓存后复用)
 * - 优先使用系统首选语言或环境变量 `LITE_BROWSER_LANG` 指定的语言，失败时回退到英文
 * @returns {Object} 本地化字符串映射对象
 */
function getLocale() {
  if (_localejson !== null) return _localejson;
  const preferredLangs = app.getPreferredSystemLanguages();
  const topLocale = (preferredLangs[0] || 'en').split('-')[0];
  const cmdLocale = process.env.LB_LANG;
  const usrlocale = supportLang.includes(topLocale) ? topLocale : 'en';
  const locale = supportLang.includes(cmdLocale) ? cmdLocale : usrlocale;

  let rawjson;
  try {
    // 尝试加载对应语言文件
    rawjson = fs.readFileSync(path.join(AppPath, 'lang', `${locale}.json`), 'utf-8');
    _localejson = JSON.parse(rawjson);
    debugLog('info', `Localization language: ${locale}`);
  } catch (err0) {

    // 首选语言不可用
    debugLog('warn', `Unable to load localization language file ${locale}.json, using default language instead.`);
    app.whenReady().then(() => dialog.showMessageBox({
      type: 'warning',
      title: 'Not use localization language',
      message: `Unable to load localization language file ${locale}.json, using default language instead.`,
      buttons: ['Confirm', 'Details'],
      defaultId: 0,
      cancelId: 0
    }).then(cho => { if (cho == 1) dialog.showErrorBox('Error Details', err0.stack) }));

    // 加载默认语言文件
    try {
      rawjson = fs.readFileSync(path.join(AppPath, 'lang', 'en.json'), 'utf-8');
      _localejson = JSON.parse(rawjson);
      debugLog('info', 'Localization language: en (fallback)');
    } catch (err1) {
      debugLog('error', 'Fatal Error: Language file load failed!');
      dialog.showErrorBox('Fatal Error: Language file missing', 'Unable to load default localization language file en.json. The application will exit.');
      process.exit(1);
    }
  }

  return _localejson;
}

/**
 * 读取并返回指定文件的文本内容
 * - 若文件或目录不存在则创建并写入 `defaultData` 后返回该默认值
 * @param {string|null} [filePath=null] - 要读取的文件路径
 * @param {string} [defaultData=''] - 当文件不存在时写入并返回的默认内容
 * @returns {string|undefined} 文件内容；当 `filePath` 为 `null` 时返回 `undefined`
 * @throws fs 子函数调用时可能抛出的错误
 */
function getFile(filePath = null, defaultData = '') {
  if (filePath === null || !DataPath.access.R) return defaultData;
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    if (DataPath.access.W) {
      debugLog('info', 'File not exit, trying to created width default content - File:', filePath);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, defaultData);
    }
    return defaultData;
  }
}

let settings = null;
/**
 * 获取当前的程序配置，若不存在配置文件则会静默尝试写入默认配置 (缓存后复用)
 * @returns {Object} 当前的用户自定义配置或默认配置
 */
function getSettings() {
  if (settings !== null) return settings;
  const file = path.join(DataPath.basic, 'settings.json')
  if (!DataPath.access.R) return defaultSetting

  try {
    let a = getFile(file, JSON.stringify(defaultSetting))
    settings = JSON.parse(a);
  } catch (err) {
    debugLog('warn', 'Failed to load local configuration file, using default configuration file:', err.message);
    settings = defaultSetting;
  }

  const cmdNoGPU = app.commandLine.hasSwitch('no-gpu')
  if (cmdNoGPU) settings.app.useGPU = false;

  return settings
}

/**************** 窗口相关 ****************/

let _nomenuSession = null;
/**
 * 获取用于无菜单窗口的 Electron `Session` 实例(缓存后复用)
 * @returns {Electron.Session} Electron 会话对象
 */
function getNomenuSession() {
  return _nomenuSession ??= session.fromPartition('persist:nomenu');
}

/**
 * 打开一个独立的工具窗口 (位于 `html/tools/<name>.html`)
 * @param {string} [name=''] - 工具页面的文件名，为空时不做任何操作
 * @returns {void}
 */
function openToolsWindow(name = '') {
  if (name.trim() == '' || !settings?.app.toolBox) return;
  debugLog('info', `Opening tools window: ${name}`);
  const newwin = new BrowserWindow({
    width: 1024,
    height: 600,
    icon: IconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: getNomenuSession(),
      preload: path.join(AppPath, 'api', 'preload', 'tools.js')
    }
  });
  newwin.setMenu(debugMenu);
  newwin.loadURL(pathToFileURL(path.join(AppPath, 'html', 'tools', name + '.html')).href);
}

/**
 * 在当前聚焦窗口打开插入JS窗口，若无聚焦窗口或窗口已销毁则不执行任何操作
 * @returns {void}
 */
function insertJS() {
  if (!settings?.app.insertjs) return;
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  debugLog('info', 'Opening Insert JS Window for window: ID ', mainWindow.id);
  mainWindow.webContents.executeJavaScript('litebrowser.registerWindow()');
  const childWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 500,
    icon: IconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: getNomenuSession(),
      preload: path.join(AppPath, 'api', 'preload', 'insertjs.js'),
      additionalArguments: [`--parent-window-id=${mainWindow.id}`]
    }
  });
  childWindow.setMenu(debugMenu);
  childWindow.loadFile(path.join(AppPath, 'html', 'insert', 'index.html'));
}

/**************** 其他函数 ****************/

const _imgRegex = /<img[^>]*src="(data:image\/([a-zA-Z]+);base64,([^">]+))"[^>]*>/g;
const _fileRegex = /file:\/\/[^">]+\/([^">]+)/g;
/**
 * 从 HTML 内容中分离并保存内嵌的 base64 图像为文件，同时替换为占位符 `$<filename>$`
 * - 会把 `file://.../filename.ext` 形式的引用还原为 `$filename$`
 * - 保存新的 base64 图像到 `imgDir` 并返回新的 HTML
 * - 删除 `imgIDsCache` 中不再使用的旧文件
 * @param {string} [content=''] - 包含 image 标签或 file:// 引用的 HTML 内容
 * @param {string|null} imgDir - 保存图片的目标目录；为 `null` 时返回早期结果并不做保存
 * @param {string[]} [imgIDsCache=[]] - 先前的图片 ID 列表，用于清理不再使用的文件
 * @returns {{html:string,isUpdate:boolean,IDCache:string[]}} 返回对象：新 HTML、是否发生更新、以及新的 ID 列表
 */
function isolateImage(content = '', imgDir = null, imgIDsCache = []) {
  if (!imgDir) return;

  // 还原图片ID
  let imgIDs = [];
  const rawHtml = content.replace(_fileRegex, (_, filename) => {
    imgIDs.push(filename);
    return `$${filename}$`;
  });
  const oldIDs = imgIDs.length;

  // 分离图片
  const newHtml = rawHtml.replace(_imgRegex, (match, fullBase64, ext, base64Data) => {
    // 生成唯一 ID
    const newImgID = crypto.randomUUID();
    const filename = `${newImgID}.${ext}`;
    const filePath = path.join(imgDir, filename);

    // 保存图像
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);
    imgIDs.push(filename);

    // 替换原base64
    return match.replace(fullBase64, `$${filename}$`);
  });

  // 清理未使用的图像
  if (imgIDs == imgIDsCache) return { html: newHtml, isUpdate: false, IDCache: imgIDsCache };
  let deleted = [];
  const newIDs = new Set(imgIDs);
  deleted = imgIDsCache.filter(x => !newIDs.has(x));
  deleted.forEach(file => fs.unlinkSync(path.join(imgDir, file)));

  debugLog('info', `Image isolation completed. New: ${imgIDs.length - oldIDs} Removed: ${deleted.length} Total: ${imgIDs.length}`);
  return { html: newHtml, isUpdate: true, IDCache: imgIDs }
}

export {
  getFile,
  insertJS,
  debugLog,
  getLocale,
  getSettings,
  isolateImage,
  cmdLineHandle,
  openToolsWindow,
  getNomenuSession,
};