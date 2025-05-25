# Lite Browser
English Version: [README_EN.md](README_EN.md)<br>
一个适用于适用于轻量级网络环境或部分网页调试需求的浏览器，基于electron。<br>
主页面默认背景图片[Pixiv ID: 76545259](https://www.pixiv.net/artworks/76545259)
## 运行时数据
DATA_DIR默认为可执行文件目录下的resources文件夹，可通过LITE_BROWSER_DATA_PATH环境变量覆盖。<br>
运行时的electron数据默认存储为：DATA_DIR/userData文件夹，用户自定义js文件存储在，DATA_DIR/insertjs文件夹，其他文件默认存储为：DATA_DIR文件夹。
## 主页面设置
主页面设置文件存储在DATA_DIR/setting.json中。<br>
更改或读取设置通过页面js调用预加载脚本中暴露的ipc模块发送给渲染进程。
```javascript
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg), // 获取设置
  setSetting: (json) => ipcRenderer.send('setting-change', json), // 修改设置
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64) // 获取或设置图片
})
```
渲染进程会首先检测请求是否来自Window ID为0的页面(主页面)，若不是主页面则返回，其他情况出现运行错误会弹出提示窗口。
```javascript
ipcMain.on('setting-change', (event, json) => {
  if (event.sender.id != 1) return; // 检测是否来自主页面
  try {
    // ....
  } catch (err) {
    dialog.showErrorBox('配置修改错误', err.stack)  // 弹出错误信息
  }
});
```
setting.json文件结构：
```json
{
    "search": { // 搜索引擎相关
        "id": 1, // 搜索引擎ID，若为-1则为自定义
        "url": "" // 自定义搜索引擎URL
    },
    "theme": { // 主题相关
        "color": { // 主题颜色
            "main": "#60eeee", // 页面主要颜色,加载时会加上0.77的透明度
            "text": "#000000" // 页面文字颜色
        },
        "background": "background.jpg" // 背景图片路径，null为默认背景，若为其他背景则文件在DATA_DIR文件夹
    }
}
```
## 书签设置
书签设置文件存储在DATA_DIR/bookmark.json中。<br>
更改或读取仍然通过页面js调用预加载脚本中暴露的ipc模块发送给渲染进程。
```javascript
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'), // 获取书签
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time), // 添加书签
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name), // 删除书签
  // ....
})
```
和主页面设置修改一样渲染进程会首先检测请求是否来自Window ID为0的页面(主页面)，若不是主页面则返回，其他情况出现运行错误会弹出提示窗口。
```javascript
ipcMain.on('bookmarks-add', (event, name, url, time) => {
  if (event.sender.id != 1) return; // 检测是否来自主页面
  try {
    // ....
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack); // 弹出错误信息
  }
});
```
bookmarks.json 文件结构:
```json
{
    // ....
    "1748138860808": { // 书签ID为添加时的时间戳
        "title": "测试项目", // 书签名称
        "url": "https://www.example.com/" // 书签URL
    },
    // ....
}
```
## 页面js插入
用户自定义js文件存储在DATA_DIR/insertjs目录下，文件名必须为*.js，通过点击菜单中的"注入JavaScript文件(F1)"或按下F1键，即可选择要插入的js文件。<br><br>
插入js文件时程序会首先通过executeJavaScriptInIsolatedWorld在当前焦点窗口执行预加载脚本中暴露的litebrowser.registerWindow()方法向渲染进程中注册一个window对象，然后等待并通过executeJavaScript将用户选择的js文件插入到当前焦点窗口中。
```javascript
function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.webContents.executeJavaScriptInIsolatedWorld('litebrowser.registerWindow()') // 向主进程中注册window对象
  const childWindow = new BrowserWindow({
    // ....
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`], // 向js文件选择子窗口传递需要注入窗口的id
      // ....
    }
  });
  // ....
  ipcMain.once('send-data-back', (_, data) => mainWindow.webContents.executeJavaScript(data)); // 监听并注入用户选择的js文件内容
}
```
js文件选择子窗口被加载时会读取父窗口的id并通过预加载脚本暴露的ipc通信获取可用文件列表，此页面用户通过点击选择并可以修改或删除，双击指定条目后会向父窗口发送文件内容，并注入到页面中执行。
```javascript
/* js插入子窗口预加载脚本 */

// 获取父窗口id
const arg = process.argv.find(arg => arg.startsWith('--parent-window-id='));
const parentID = arg ? parseInt(arg.split('=')[1], 10) : null;

contextBridge.exposeInMainWorld('litebrowser', {
    parentID: parentID, // 父窗口id
    getList: () => ipcRenderer.invoke('insertjs-get-jslist'), // 获取脚本列表
    addJS: () => ipcRenderer.send('insertjs-add-js'), // 添加脚本
    removeJS: (name) => ipcRenderer.send('insertjs-remove-js', name), // 删除脚本
    openDir: () => ipcRenderer.send('insertjs-open-dir'), // 打开脚本目录
    insertJS: (id, js) => ipcRenderer.send('insertjs-insert-js', id, js) // 插入脚本
})
```