import { appPath, iconPath, getNomenuSession } from '../lib/config.js';
import { BrowserWindow, dialog } from 'electron';
import { debugMenu } from '../api/menu.js';
import { pathToFileURL } from 'url';
import path from 'path';

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

function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox('错误', '当前没有可用的浏览器窗口');
    return;
  }
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

export {
  openToolsWindow,
  insertJS
}