import { ipcMain, BrowserWindow, Menu } from 'electron';
import MenuList from '../menu.js';
const topMenuSwitch = (win) => (process.platform !== 'darwin') ? [{
    label: '切换菜单栏可见性',
    click: ()=> win.webContents.executeJavaScript('litebrowser.switchTopMenu()')
}] : [];

// 右键菜单响应
ipcMain.on('menu-contextmenu', (event, x, y) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    const contextMenu = Menu.buildFromTemplate([
        ...MenuList,
        ...topMenuSwitch(win),
        {
            label: '关闭右键菜单',
            click: () => win.webContents.executeJavaScript('litebrowser.disableContextMenu()')
        }
    ]);
    contextMenu.popup({ window: win, x, y });
});

// 菜单栏切换事件
ipcMain.on('menu-switch-top-menu', (event, isShow) => {
    if (process.platform === 'darwin') return; // macOS 不支持隐藏菜单栏
    
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    
    win.setMenu(isShow ? Menu.buildFromTemplate(MenuList) : null);
});