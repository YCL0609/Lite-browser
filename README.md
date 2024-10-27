# Lite-browser
适用于轻量级 Web 环境的浏览器.<br>
A browser for lightweight web environments.<br>
默认背景图片background.jpg为网络图片,如果你知道出处请告诉我.<br>
The default background image background.jpg is a web image, please let me know if you know the source.
## Note
如果需要自行编译请修改main.js和Tools/menu.js将引用从开发模式转换为日常模式<br>
If you need to compile yourself, modify main.js and Tools/menu.js to convert references from dev mode to everyday mode<br>
例如(e.g.):
```javascript
/****** 当前模式为开发模式模式(The current mode is development mode) ******/
const menu_tool = require('./Tools/menu').default;
// const menu_tool = require('../Tools.asar/menu').default;

/****** 当前模式为日常模式(The current mode is Everyday mode) ******/
// const menu_tool = require('./Tools/menu').default;
const menu_tool = require('../Tools.asar/menu').default;
```
