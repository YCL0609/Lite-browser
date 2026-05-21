import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const needDir = [
  'html/tools/common/katex',
  'extrares/license'
]

const filesCopy = [
  // DOMPurify
  {
    from: 'node_modules/dompurify/dist/purify.min.js',
    to: 'html/tools/common/purify.min.js'
  },
  {
    from: 'node_modules/dompurify/LICENSE',
    to: 'extrares/license/DOMPurify License.txt'
  },
  // Marked
  {
    from: 'node_modules/marked/lib/marked.umd.js',
    to: 'html/tools/markdown/marked.min.js'
  },
  {
    from: 'node_modules/marked/LICENSE.md',
    to: 'extrares/license/Marked License.txt'
  },
  // KaTeX
  {
    from: 'node_modules/katex/dist/katex.min.js',
    to: 'html/tools/common/katex/katex.min.js'
  },
  {
    from: 'node_modules/katex/dist/katex.min.css',
    to: 'html/tools/common/katex/katex.min.css'
  },
  {
    from: 'node_modules/katex/dist/contrib/auto-render.min.js',
    to: 'html/tools/common/katex/auto-render.min.js'
  },
  {
    from: 'node_modules/katex/LICENSE',
    to: 'extrares/license/KaTeX License.txt'
  }
];

const dirsCopy = [
  // KaTeX字体文件
  {
    from: 'node_modules/katex/dist/fonts',
    to: 'html/tools/common/katex/fonts',
    deleteOld: true,
    ext: 'woff2'
  }
]

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// 初始化文件夹
console.log('==> Initialize folder ...');
for (const dir of needDir) {
  try {
    const target = path.join(rootDir, dir);
    console.log('Recreate folder: '+ target);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}

// 复制文件
console.log('==> Copying Files ...');
for (const file of filesCopy) {
  try {
    const src = path.join(rootDir, file.from);
    const dest = path.join(rootDir, file.to);
    fs.copyFileSync(src, dest);
    console.log(src + " => " + dest);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}

// 复制文件夹
console.log('==> Copying folder ...');
for (const dir of dirsCopy) {
  try {
    const src = path.join(rootDir, dir.from);
    const dest = path.join(rootDir, dir.to);
    if (dir.deleteOld) fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    for (const dirFile of fs.readdirSync(src)) {
      const filesrc = path.join(src, dirFile);
      try {
        const stat = fs.statSync(filesrc);
        if (!stat.isFile()) continue; // 跳过目录或其它非文件项
      } catch (err) {
        console.error('Skip unreadable file:', filesrc, err.message);
        continue;
      }

      // 如果指定了 ext，只复制匹配扩展名的文件
      if (dir.ext) {
        const fileExt = path.extname(dirFile).replace(/^\./, '').toLowerCase();
        if (fileExt !== String(dir.ext).toLowerCase()) continue;
      }

      const filedest = path.join(dest, dirFile);
      fs.copyFileSync(filesrc, filedest);
      console.log(filesrc + " => " + filedest);
    }
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}
