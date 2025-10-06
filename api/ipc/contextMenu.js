const { ipcMain, BrowserWindow, Menu } = require('electron');
const MenuList = require('../menu');

// 右键菜单
ipcMain.on('show-context-menu', (_, x, y) => {
    const win = BrowserWindow.getFocusedWindow();
    const Menuobj = Menu.buildFromTemplate([...MenuList, {
        label: '关闭菜单栏',
        click: () => win.setMenu(null)
    }, {
        label: '关闭右键菜单', click: () => win.webContents.executeJavaScript('litebrowser.disableContextMenu()')
    }]);
    Menuobj.popup({ window: win, x, y })
});