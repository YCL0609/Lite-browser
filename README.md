# Lite-browser
适用于轻量级 Web 环境的浏览器.<br>
A browser for lightweight web environments.<br>
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