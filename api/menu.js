import { shell, clipboard, dialog, BrowserWindow } from 'electron';
import { openToolsWindow, insertJS } from '../lib/menuControl.js';
import { ToolsInfo } from '../lib/config.js';

// 工具菜单
let ToolsMenu = [];
for (let i = 0; i < ToolsInfo.id.length; i++) {
  const json = {
    label: ToolsInfo.name[i],
    accelerator: 'Alt+' + (i + 1),
    click: () => openToolsWindow(ToolsInfo.id[i] + '.html')
  }
  ToolsMenu.push(json);
}

// 菜单项目
export default [{
  label: '工具...',
  submenu: ToolsMenu
}, {
  label: '编辑...',
  submenu: [{
    label: '撤销',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: '重做',
    accelerator: 'CmdOrCtrl+Y',
    role: 'redo'
  }, {
    label: '全选',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }, {
    type: 'separator'
  }, {
    label: '剪切',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: '复制',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: '粘贴',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: '粘贴为纯文本',
    accelerator: 'CmdOrCtrl+Shift+V',
    role: 'pasteAndMatchStyle'
  }]
}, {
  label: '控制...',
  submenu: [{
    label: '后退',
    accelerator: 'Alt+Left',
    click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('history.back()')
  }, {
    label: '刷新(F5)',
    accelerator: 'F5',
    role: 'reload'
  }, {
    label: '前进',
    accelerator: 'Alt+Right',
    click: () => BrowserWindow.getFocusedWindow().webContents.executeJavaScript('history.forward()')
  }, {
    type: 'separator'
  }, {
    label: '全屏',
    accelerator: 'F11',
    role: 'toggleFullScreen'
  }, {
    label: '开发者工具',
    accelerator: 'F12',
    role: 'toggleDevTools'
  }, {
    type: 'separator'
  }, {
    label: '用默认浏览器打开',
    accelerator: 'F8',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      shell.openExternal(url);
    }
  }, {
    label: '显示当前网址',
    accelerator: 'F10',
    click: () => {
      const url = BrowserWindow.getFocusedWindow().webContents.getURL();
      dialog.showMessageBox({
        type: 'info',
        title: '当前网址',
        message: url,
        buttons: ['复制到剪贴板', '关闭'],
        defaultId: 1,
        cancelId: 1
      })
        .then(result => {
          if (result.response === 0) clipboard.writeText(url);
        });
    }
  }]
}, {
  label: '忽略缓存刷新(shift+F5)',
  accelerator: 'shift+F5',
  role: 'forceReload'
}, {
  label: 'JavaScript注入(F1)',
  accelerator: 'F1',
  click: insertJS
}];