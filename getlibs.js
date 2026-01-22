import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const needDir = [
  'lib/katex',
  'extrares/license'
]

const filesCopy = [
  // DOMPurify
  {
    from: 'node_modules/dompurify/dist/purify.min.js',
    to: 'lib/purify.min.js'
  },
  {
    from: 'node_modules/dompurify/LICENSE',
    to: 'extrares/license/DOMPurify License.txt'
  },
  // Marked
  {
    from: 'node_modules/marked/lib/marked.umd.js',
    to: 'lib/marked.min.js'
  },
  {
    from: 'node_modules/marked/LICENSE.md',
    to: 'extrares/license/Marked License.txt'
  },
  // KaTeX
  {
    from: 'node_modules/katex/dist/katex.min.js',
    to: 'lib/katex/katex.min.js'
  },
  {
    from: 'node_modules/katex/dist/katex.min.css',
    to: 'lib/katex/katex.min.css'
  },
  {
    from: 'node_modules/katex/dist/contrib/auto-render.min.js',
    to: 'lib/katex/auto-render.min.js'
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
    to: 'lib/katex/fonts',
    deleteold: false
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
    if (dir.deleteold) fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    for (const dirFile of fs.readdirSync(src)) {
      const filesrc = path.join(src, dirFile);
      const filedest = path.join(dest, dirFile);
      fs.copyFileSync(filesrc, filedest);
      console.log(filesrc + " => " + filedest);
    }
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}
