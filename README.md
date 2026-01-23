# Lite Browser
中文版: [README_ZH.md](README_ZH.md)<br><br>
<b><i>If the Chinese and English versions differ in meaning, the Chinese version takes precedence.</i></b><br>
A browser suitable for lightweight network environments or certain web debugging needs, built on the Electron framework.<br>
The default background image for the home page: [Pixiv ID: 76545259](https://www.pixiv.net/artworks/76545259)

## Runtime Data
The default data storage path DATA_DIR is the resources folder at the same level as app.asar (on macOS, it's the resources folder in the root of the LiteBrowser.app folder). All systems can override this using the `LITE_BROWSER_DATA_PATH` environment variable.Electron web data at runtime is stored in `DATA_DIR/userData/` by default, user-defined JavaScript files are stored in `DATA_DIR/insertjs/`, tool pages are stored locally in `DATA_DIR/tools/`, and other files are stored in `DATA_DIR/` by default.

## Language Files and Switching Logic
The program retrieves the user's preferred language list during initialization and takes the first preference. If it's not in the supported list, English is used as the primary language. All systems can override this using the `LITE_BROWSER_LANG` environment variable. All supported language IDs are stored in the `supportLang` variable in `lib/config.js`, and language files are stored in `lang/{lang}.json`. You can add language files and repackage as needed.

## Home Page Settings
Home page settings are stored in `DATA_DIR/setting.json`.<br>
Settings can be modified or retrieved by calling the IPC module exposed in the preload script through page JavaScript to send to the renderer process.
```javascript
/* api/preload/main.js */
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg), // Get settings
  setSetting: (json) => ipcRenderer.send('setting-change', json), // Modify settings
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64) // Get or set image
})
```
setting.json file structure:
```json
{
    "search": { // Search engine related
        "id": 1, // Search engine ID, -1 for custom
        "url": "" // Custom search engine URL
    },
    "theme": { // Theme related
        "color": { // Theme colors
            "main": "#60eeee", // Main page color, with 0.77 transparency applied on load
            "text": "#000000" // Page text color
        },
        "background": "background.jpg" // Background image path, null for default, other files in DATA_DIR folder
    }
}
```

## Bookmark Settings
Bookmark settings are stored in `DATA_DIR/bookmark.json`.<br>
Modifications or retrievals are still done by calling the IPC module exposed in the preload script through page JavaScript to send to the renderer process.
```javascript
/* api/preload/main.js */
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'), // Get bookmarks
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time), // Add bookmark
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name), // Delete bookmark
  // ....
})
```
bookmarks.json file structure:
```json
{
    // ....
    "1748138860808": { // Bookmark ID is the timestamp when added
        "title": "Test Project", // Bookmark name
        "url": "https://www.example.com/" // Bookmark URL
    },
    // ....
}
```

## Page JavaScript Injection
User-defined JavaScript files are stored in the `DATA_DIR/insertjs/` directory with filenames as {32-character random string}.js, and name.json records the correspondence with the original filename. Click the `JavaScript Injection` button in the menu (on macOS: `"Control..." => "JavaScript Injection"`) or press <b>F1</b> to select a JavaScript file to inject.<br><br>
When injecting a JavaScript file, the program first executes the `litebrowser.registerWindow()` method exposed in the preload script through the `executeJavaScriptInIsolatedWorld` function in the currently focused window to register a window object in the renderer process, then waits and injects the user-selected JavaScript file into the currently focused window through executeJavaScript.
```javascript
/* lib/functions.js */
function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.webContents.executeJavaScriptInIsolatedWorld('litebrowser.registerWindow()') // Register window object in main process
  const childWindow = new BrowserWindow({
    // ....
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`], // Pass the ID of the window to be injected to the JavaScript file selection child window
      // ....
    }
  });
  // ....
  ipcMain.once('send-data-back', (_, data) => mainWindow.webContents.executeJavaScript(data)); // Listen and inject the selected JavaScript file content
}
```
When the JavaScript file selection child window is loaded, it reads the parent window's ID and obtains the list of available files through IPC communication exposed in the preload script. Users can click on this page to select the script to modify or delete. After double-clicking a JavaScript entry, the file content is sent to the parent window and injected into the page by the parent window for execution.
```javascript
/* api/preload/insertjs.js */

// Get parent window ID
const arg = process.argv.find(arg => arg.startsWith('--parent-window-id='));
const parentID = arg ? parseInt(arg.split('=')[1], 10) : null;

contextBridge.exposeInMainWorld('litebrowser', {
    parentID: parentID, // Parent window ID
    getList: () => ipcRenderer.invoke('insertjs-get-jslist'), // Get script list
    addJS: () => ipcRenderer.send('insertjs-add-js'), // Add script
    removeJS: (name) => ipcRenderer.send('insertjs-remove-js', name), // Delete script
    openDir: () => ipcRenderer.send('insertjs-open-dir'), // Open script directory
    insertJS: (id, js) => ipcRenderer.send('insertjs-insert-js', id, js) // Inject script
})
```

### Automatic JavaScript Injection
When each page loads, the preload script executes `ipcRenderer.send('insertjs-auto-js-insert')` to send an auto-injection signal to the backend. After receiving it, the backend obtains the triggered URL and checks if there is any auto-injection logic for this domain. After filtering out useless logic, it performs auto-injection. If there are changes to the injection configuration, they are saved to a file and cached in the `autoJSCache` local variable. All rules are in the `DATA_DIR/insertjs/auto.json` file.
```javascript
/* api/ipc/insertjs.js */

// Auto-inject scripts
ipcMain.on('insertjs-auto-js-insert', (event) => {
    // ......
    // Get the script list for the host
    const host = (urlObj.host === '') ? -1 : urlObj.host;
    if (host === -1) return;
    if (autoJSCache == null) autoJSCache = JSON.parse(getFile(jsonPath_auto, defaultJson_auto));
    let changed = false;
    // Check if files exist, remove if not
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
      // Inject remaining existing scripts
      for (const jsid of jsList) {
        const filepath = path.join(DataPath, 'insertjs', jsid + '.js');
        const content = fs.readFileSync(filepath, 'utf-8');
        win.webContents.executeJavaScript(content); // Inject script
      }
      // Save if list has changed
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
auto.json file structure:
```json
{
  "hosts": [ // All website domains that will auto-execute
    "example.net",
    "www.example.com"
    // ...
  ],
  "example.net": [ // Specific configuration for example.net domain
    "fnuplcuj0hbhheceb3std5w9gnr1cp9d", // ID of the JavaScript file to be injected
    "6df4zk44ub5mo1w59ix49yurcpwvfx8y",
    "eu9olax01oib7pwvjdxzjleabbc9w46o"
  ]
  // ...
}
```