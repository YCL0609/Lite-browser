# Lite Browser
**English Version: [README.md](README.md)**<br><br>
一个用于轻量级网络环境的级浏览器，项目主体基于electron构建且可运行在Windows、Linux和MacOS多个系统上运行。<br>
- 应用自带部分html小工具可辅助日常的部分工作;
- 应用可向网页注入JavaScript来实现自定义操作 (不支持油猴API);
- 通过命令行或配置文件可让程序进入"硬件性能受限模式"并切换为低性能UI;
- 程序默认为便携环境设置所有数据均存储到程序同目录。* 在MacOS上将app放入Application文件夹时会使用苹果默认的用户数据目录作为默认。

## 项目依赖
- Electron - 项目基础依赖 - [https://github.com/electron/electron](https://github.com/electron/electron)
- KaTeX - 小工具数学公式渲染库 - [https://github.com/KaTeX/KaTeX](https://github.com/KaTeX/KaTeX)
- DOMPurify - 小工具HTML清洗库 - [https://github.com/cure53/DOMPurify](https://github.com/cure53/DOMPurify)
- Marked - 小工具markdown渲染库 - [https://github.com/markedjs/marked](https://github.com/markedjs/marked)

## 运行和构建
```bash
git clone https://github.com/YCL0609/Lite-browser
cd Lite-browser
npm i

## 在命令行中运行
npm run getlibs
npm run start

## 构建
npm run build
```

## 命令行和环境变量
### 命令行参数
|         命令行参数         |       对应的配置文件键       |         描述         |
| :------------------------: | :--------------------------: | :------------------: |
|    --app-hw-limit-mode     |       !app.normalMode        | 使用硬件性能受限模式 |
|     --app-disable-gpu      |          app.useGPU          |     禁用硬件加速     |
|   --app-disable-toolbox    |         app.toolBox          |      禁用工具箱      |
| --app-disable-history-file |         app.history          |   禁用历史URL记录    |
|  --app-disable-insert-js   |         app.insertjs         |  禁用JavaScript注入  |
|   --app-disable-menu-all   | app.topMenu和app.contentMenu |     禁用所有菜单     |
|   --app-disable-menu-top   |         app.topMenu          |     禁用顶部菜单     |
| --app-disable-menu-content |       app.contentMenu        |     禁用右键菜单     |

程序在初始化时会获取用户偏好语言列表并截取第一个偏好语言，若不在支持列表中则使用英文作为主语言，可以通过`LB_LANG`环境变量覆盖，受支持的语言id列表存储在`core/config.js`中的`supportLang`变量中，语言文件存储在`lang/{lang}.json`中，可自行添加语言文件后进行打包。

### 环境变量
|      变量名      | 默认值 |             描述             |
| :--------------: | :----: | :--------------------------: |
|      LB_LOG      |   0    |         输出运行日志         |
|     LB_DEBUG     |   0    |         启用调试模式         |
|  LB_DEBUG_TRACE  |   0    |         打印调用堆栈         |
|   LB_DATA_PATH   |   *    |      设置app主存储目录       |
| LB_USERDATA_PATH |   **   | 设置Chromium用户数据存储目录 |

**\* 默认数据存储路径DATA_DIR在Linux/win上存储在可执行文件同目录下的Data文件夹，在MacOS上会存储在和.app文件夹同目录的Data文件夹。**<br>
**\*\* Chromium的用户数据默认会存储在`DATA_DIR/userData`目录。**

### 主页面设置
|      配置键名      |              默认值              |             描述              |
| :----------------: | :------------------------------: | :---------------------------: |
| mainWin.searchUrl  | https://www.bing.com/search?q=%s |     主页面使用的搜索引擎      |
| mainWin.background |            (空字符串)            | 主页面背景文件名(为空则禁用)* |

**\* 当'低硬件性能模式'启用后主页面会禁用背景图像**

## JavaScript 注入
用户自定义js文件存储在`DATA_DIR/insertjs`目录下文件名为{32位随机字串}.js，由`DATA_DIR/insertjs/name.json`记录与原始文件名的对应关系，`DATA_DIR/insertjs/auto.json`记录自动注入相关逻辑。

通过点击菜单的`JavaScript注入`按钮(Mac OS为`"控制..."=>"JavaScript注入件"`)或按下**F1**键，即可进入JavaScript注入窗口。选择后点击`注入`按钮即可注入所有选择的JavaScript文件，自动注入模式时点击`应用列表`会记录当前列表为此域名自动注入列表。

### 页面手动插入
当打开注入窗口时主进程会通过`win.webContents.executeJavaScriptInIsolatedWorld()`函数在当前焦点窗口执行预加载脚本中暴露的`litebrowser.registerWindow()`函数，函数渲染进程注册当前窗口对象并将当前窗口的ID作为参数传入选择窗口，当用户点击应用时则通过同一个函数将用户选择的JavaScript文件注入当前窗口。

```javascript
/* core/windows.js */
function openInsertJS() {
  // ....
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

### 自动页面插入
每个在默认session的页面加载时预加载脚本会执行`ipcRenderer.send('insertjs-auto-js-insert')`向后端发送自动注入信号，后端会自动判断当前域名是否在配置文件的hosts数组中，若匹配成功则会读取配置文件对应域名的配置，在注入前会进行一次过滤来去掉无用逻辑，去掉后会依次读取并注入发送方窗口。

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
          fs.writeFileSync(jsonPath_auto, JSON.stringify(autoJSCache, null, 2), 'utf-8');
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
  "example.net": [ // 单个域名的具体配置
    "fnuplcuj0hbhheceb3std5w9gnr1cp9d", // 需要插入的js文件id
    "6df4zk44ub5mo1w59ix49yurcpwvfx8y",
    "eu9olax01oib7pwvjdxzjleabbc9w46o"
  ]
  // ...
}
```