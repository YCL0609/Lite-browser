# Lite Browser
中文版本: [README.md](README.md)<br>
An electron-based browser for lightweight web environments or partial web debugging needs. <br>
The default background image for the main page [Pixiv ID: 76545259](https://www.pixiv.net/artworks/76545259)
## Runtime Data
DATA_DIR defaults to the resources folder in the executable file directory, which can be overridden by LITE_BROWSER_DATA_PATH environment variables. <br>
By default, the electron data at runtime is stored in the DATA_DIR/userData folder, the user-defined js files are stored in the DATA_DIR/insertjs folder, and other files are stored in the DATA_DIR folder by default.
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
The rendering process will first detect whether the request is from a page with Window ID 0 (main page), and return if it is not the main page.
```javascript
ipcMain.on('setting-change', (event, json) => {
  if (event.sender.id != 1) return; // Detect if it's from the main page
  try {
    // ....
  } catch (err) {
    dialog.showErrorBox('配置修改错误', err.stack)  // An error message pops up
  }
});
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
As with the main page setting modification, the rendering process will first detect whether the request is from a page with Window ID 0 (main page), and return if it is not the main page.
```javascript
ipcMain.on('bookmarks-add', (event, name, url, time) => {
  if (event.sender.id != 1) return; // Detect if it's from the main page
  try {
    // ....
  } catch (err) {
    dialog.showErrorBox('书签添加错误', err.stack); // An error message pops up
  }
});
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
The user-defined js file is stored in the DATA_DIR/insertjs directory, the file name must be *.js, and you can select the js file to be inserted by clicking "控制..."==>"注入JavaScript文件" in the menu or pressing the F1 key. <br><br>
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
When the JS file selection subwindow is loaded, it will read the ID of the parent window and obtain the list of available files through the IPC communication exposed by the preload script, the user of this page can modify or delete by clicking on the selected item, and after double-clicking the specified entry, the file content will be sent to the parent window and injected into the page for execution.
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