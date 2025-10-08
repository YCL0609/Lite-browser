const fs = require('fs');
const path = require('path');

// 获取文件内容
function getFile(filePath, defaultData = '') {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  } else {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // 创建多级目录
    }
    fs.writeFileSync(filePath, defaultData);
    return defaultData;
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
  getFile,
  RandomString
};