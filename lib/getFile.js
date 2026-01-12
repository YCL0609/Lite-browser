import path from 'path';
import fs from 'fs';

// 获取文件内容 (调用时需要确保有错误处理)
export function getFile(filePath, defaultData = '') {
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