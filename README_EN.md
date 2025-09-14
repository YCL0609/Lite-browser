# Lite Browser
中文版本: [README.md](README.md)<br><br>
An electron-based browser for lightweight web environments or partial web debugging needs. <br>
The default background image for the main page [Pixiv ID: 76545259](https://www.pixiv.net/artworks/76545259)
## Runtime Data
DATA_DIR defaults to the resources folder in the executable file directory, which can be overridden by LITE_BROWSER_DATA_PATH environment variables. <br>
By default, the runtime electron web page data is stored in the DATA_DIR/userData/ folder, the user-defined js files are stored in the DATA_DIR/insertjs/ folder, and the other files are stored in the DATA_DIR/ folder by default.
## Main Page Setup
The main page setup file is stored in the DATA_DIR/setting.json. <br>
Changing or reading settings is sent to the rendering process via the IPC module exposed in the preload script via the page js call.
```javascript
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg), // Get the setting
  setSetting: (json) => ipcRenderer.send('setting-change', json), // Modify the settings
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64) // Get or set the image
})
```
setting.json file structure:
```json
{
    "search": { // Search engine related
        "id": 1, // search engine ID, if -1 is custom
        "url": "" // Custom search engine URL
    },
    "theme": { // Theme-related
        "color": { // Theme color
            "main": "#60eeee", // The main color of the page, which will be loaded with a transparency of 0.77
            "text": "#000000" // Page text color
        },
        "background": "background.jpg" // background image path, null is the default background, if it is other background, the file is in the DATA_DIR folder
    }
}
```
## Bookmark settings
Bookmark settings files are stored in DATA_DIR/bookmark.json. <br>
Changes or reads are still sent to the rendering process via the ipc module exposed in the preload script via page js calls.
```javascript
contextBridge.exposeInMainWorld('litebrowser', {
  // ....
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'), // Get bookmarks
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time), // Add bookmarks
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name), // Delete bookmark
  // ....
})
```
bookmarks.json File Structure:
```json
{
    // ....
    "1748138860808": { // The bookmark ID is the timestamp when it was added
        "title": "Test item", // Bookmark name
        "url": "https://www.example.com/" // Bookmark URL
    },
    // ....
}
```
## Page js insertion
The user-defined js file is stored in the DATA_DIR/insertjs directory, The file named {32-character random string}.js records the correspondence with the original filename in name.json, and you can select the js file to be inserted by clicking "控制..."==>"注入JavaScript文件" in the menu or pressing the F1 key. <br><br>
When inserting a js file, the program first registers a window object with the rendering process via the litebrowser.registerWindow() method exposed in the executeJavaScriptInIsolatedWorld preload script in the current focus window, and then waits for the user-selected js file to be inserted into the current focus window via executeJavaScript.
```javascript
function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.webContents.executeJavaScriptInIsolatedWorld('litebrowser.registerWindow()') // Register the window object with the main process
  const childWindow = new BrowserWindow({
    // ....
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`], // Pass the ID of the window to be injected into the js file selection subwindow
      // ....
    }
  });
  // ....
  ipcMain.once('send-data-back', (_, data) => mainWindow.webContents.executeJavaScript(data)); // Listen to and inject the content of the JS file selected by the user
}
```
When the JS file selection child window is loaded, it will read the ID of the parent window and obtain the list of available files through the IPC communication exposed by the preload script, the user of this page can select the script to modify or delete by clicking on it, and after double-clicking the JS entry, the file content will be sent to the parent window, and the parent window will inject it into the page for execution. After clicking the specified button, you will enter the selection mode, which allows you to select a js file, and the selected js file will be automatically executed under this domain name.
```javascript
/* js insert subwindow preload script */

// Get the ID of the parent window
const arg = process.argv.find(arg => arg.startsWith('--parent-window-id='));
const parentID = arg ? parseInt(arg.split('=')[1], 10) : null;

contextBridge.exposeInMainWorld('litebrowser', {
    parentID: parentID, // Parent window ID
    getList: () => ipcRenderer.invoke('insertjs-get-jslist'), // Get a list of scripts
    addJS: () => ipcRenderer.send('insertjs-add-js'), // Add a script
    removeJS: (name) => ipcRenderer.send('insertjs-remove-js', name), // Delete the script
    openDir: () => ipcRenderer.send('insertjs-open-dir'), // Open the Scripts directory
    insertJS: (id, js) => ipcRenderer.send('insertjs-insert-js', id, js) // Insert a script
})
```
### Automatic JS insertion
Enter the script selection by clicking the '
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21ZM12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23Z" fill="currentColor" /><path d="M16 12L10 16.3301V7.66987L16 12Z" fill="currentColor" /></svg>
' button inserted into the page via js, you can enter the script selection. After completing your selection, click again to save. All selected file names will be saved in DATA_DIR/insertjs/auto.json.
```json
{
  "hosts": [ // All website domains that can automatically execute JS.
    "example.net",
    "www.example.com"
    // ...
  ],
  "example.net": [ // Specific configuration of the example.net domain
    "fnuplcuj0hbhheceb3std5w9gnr1cp9d", // ID of the js file to be inserted
    "6df4zk44ub5mo1w59ix49yurcpwvfx8y",
    "eu9olax01oib7pwvjdxzjleabbc9w46o"
  ]
  // ...
}
```