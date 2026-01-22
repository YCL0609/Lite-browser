# Lite Browser
English Version: [README.md](README.md)<br><br>
一个适用于适用于轻量级网络环境或部分网页调试需求的浏览器，项目基于electron。<br>
主页面默认背景图片[Pixiv ID: 76545259](https://www.pixiv.net/artworks/76545259)

## 运行时数据
默认数据存储路径DATA_DIR为与app.asar同级目录的resources文件夹(Mac OS上为LiteBrowser.app文件夹的根目录下的resources文件夹)，所有系统均通过`LITE_BROWSER_DATA_PATH`环境变量进行覆盖。运行时的electron网页数据默认存储在`DATA_DIR/userData/`文件夹，用户自定义js文件存储在`DATA_DIR/insertjs/`文件夹，工具页面本地存储在`DATA_DIR/tools/`文件夹,其他文件默认存储在`DATA_DIR/`文件夹。

## 语言文件及切换逻辑
程序在初始化时会获取用户偏好语言列表并截取第一个偏好语言，若不在支持列表中则使用英文作为主语言，所有系统均可以通过`LITE_BROWSER_LANG`环境变量覆盖，所有受支持的语言id存储在`lib/config.js`中的`supportLang`变量中，语言文件存储在`lang/{lang}.json`中，可自行添加语言文件后进行打包。

## 主页面设置
主页面设置文件存储在`DATA_DIR/setting.json`中。<br>
更改或读取设置通过页面js调用预加载脚本中暴露的ipc模块发送给渲染进程。
```javascript
/* api/preload/main.js */
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg), // 获取设置
  setSetting: (json) => ipcRenderer.send('setting-change', json), // 修改设置
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64) // 获取或设置图片
})
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
/* api/preload/main.js */
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'), // 获取书签
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time), // 添加书签
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name), // 删除书签
  // ....
})
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
用户自定义js文件存储在DATA_DIR/insertjs目录下，文件名为{32位随机字串}.js由name.json记录与原始文件名的对应关系，通过点击菜单中的`JavaScript注入`按钮(Mac OS为`"控制..."=>"JavaScript注入件"`)或按下<b>F1</b>键，即可选择要插入的js文件。<br><br>
插入js文件时程序会首先通过`executeJavaScriptInIsolatedWorld`函数在当前焦点窗口执行预加载脚本中暴露的`litebrowser.registerWindow()`方法向渲染进程中注册一个window对象，然后等待并通过executeJavaScript将用户选择的js文件插入到当前焦点窗口中。
```javascript
/* lib/functions.js */
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
js文件选择子窗口被加载时会读取父窗口的id并通过预加载脚本暴露的ipc通信获取可用文件列表，此页面用户通过单击可选择要修改或删除的脚本，双击js条目后会向父窗口发送文件内容，并由父窗口注入到页面中执行。
```javascript
/* api/preload/insertjs.js */

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

### 自动js插入
每个页面加载时预加载脚本会执行`ipcRenderer.send('insertjs-auto-js-insert')`向后端发送自动注入信号，后端接受到后会获取触发的网址并判断是否有针对此域名的自动注入逻辑，过滤掉无用逻辑后进行自动注入，若有注入配置有变化会保存到文件并缓存到`autoJSCache`局部变量。所有规则在`DATA_DIR/insertjs/auto.json`文件内
```javascript
/* api/ipc/insertjs.js */

// 自动注入脚本
ipcMain.on('insertjs-auto-js-insert', (event) => {
    // ......
    // 获取host对应的脚本列表
    const host = (urlObj.host === '') ? -1 : urlObj.host;
    if (host === -1) return;
    if (autoJSCache == null) autoJSCache = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
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
        fs.writeFileSync(path.join(jsonPath_auto, JSON.stringify(autoJSCache, null, 2), 'utf-8'));
      }
    }
 //......
});
```
auto.json 文件结构:
```json
{
  "hosts": [ // 所有会自动执行的网站域名
    "example.net",
    "www.example.com"
    // ...
  ],
  "example.net": [ // example.net域名的具体配置
    "fnuplcuj0hbhheceb3std5w9gnr1cp9d", // 需要插入的js文件id
    "6df4zk44ub5mo1w59ix49yurcpwvfx8y",
    "eu9olax01oib7pwvjdxzjleabbc9w46o"
  ]
  // ...
}
```
