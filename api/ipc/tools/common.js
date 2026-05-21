import fs from 'node:fs';
import path from 'node:path';
import { debugLog } from '../../../core/debug.js';

const _imgRegex = /<img[^>]*src="(data:image\/([a-zA-Z]+);base64,([^">]+))"[^>]*>/g;
const _fileRegex = /file:\/\/[^">]+\/([^">]+)/g;
/**
 * 从 HTML 内容中分离并保存内嵌的 base64 图像为文件，同时替换为占位符 `$<filename>$`
 * - 会把 `file://.../filename.ext` 形式的引用还原为 `$filename$`
 * - 保存新的 base64 图像到 `imgDir` 并返回新的 HTML
 * - 删除 `imgIDsCache` 中不再使用的旧文件
 * @param {string} [content=''] - 包含 image 标签或 file:// 引用的 HTML 内容
 * @param {string|null} imgDir - 保存图片的目标目录；为 `null` 时返回早期结果并不做保存
 * @param {string[]} [imgIDsCache=[]] - 先前的图片 ID 列表，用于清理不再使用的文件
 * @returns {{html:string,isUpdate:boolean,IDCache:string[]}} 返回对象：新 HTML、是否发生更新、以及新的 ID 列表
 */
function isolateImage(content = '', imgDir = null, imgIDsCache = []) {
  if (!imgDir) return;

  // 还原图片ID
  let imgIDs = [];
  const rawHtml = content.replace(_fileRegex, (_, filename) => {
    imgIDs.push(filename);
    return `$${filename}$`;
  });
  const oldIDs = imgIDs.length;

  // 分离图片
  const newHtml = rawHtml.replace(_imgRegex, (match, fullBase64, ext, base64Data) => {
    // 生成唯一 ID
    const newImgID = crypto.randomUUID();
    const filename = `${newImgID}.${ext}`;
    const filePath = path.join(imgDir, filename);

    // 保存图像
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(filePath, buffer);
    imgIDs.push(filename);

    // 替换原base64
    return match.replace(fullBase64, `$${filename}$`);
  });

  // 清理未使用的图像
  if (imgIDs == imgIDsCache) return { html: newHtml, isUpdate: false, IDCache: imgIDsCache };
  let deleted = [];
  const newIDs = new Set(imgIDs);
  deleted = imgIDsCache.filter(x => !newIDs.has(x));
  deleted.forEach(file => fs.unlinkSync(path.join(imgDir, file)));

  debugLog('info', `Image isolation completed. New: ${imgIDs.length - oldIDs} Removed: ${deleted.length} Total: ${imgIDs.length}`);
  return { html: newHtml, isUpdate: true, IDCache: imgIDs }
}

export {
  isolateImage,
}