const fs = require('fs');
const path = require('path');
const { DataPath } = require('./config');

// 获取JSON文件内容
function getJson(name, defaultdata = {}) {
  const filePath = path.join(DataPath, name);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      fs.writeFileSync(filePath, JSON.stringify(defaultdata));
      return defaultdata;
    }
  } catch (err) {
    dialog.showErrorBox(errtext, err.stack)
    throw err;
  }
}

// 生成随机字符串
function RandomString(length = 32) {
  const characters = 'abcdefghijklmnopqrestuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports = {
  getJson,
  RandomString
};