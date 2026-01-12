import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filesToCopy = [
  // DOMPurify
  {
    from: 'node_modules/dompurify/dist/purify.min.js',
    to: 'lib/purify.min.js'
  },
  {
    from: 'node_modules/dompurify/LICENSE',
    to: 'lib/license/DOMPurify License.txt'
  },
  // Marked
  {
    from: 'node_modules/marked/lib/marked.umd.js',
    to: 'lib/marked.min.js'
  },
  {
    from: 'node_modules/marked/LICENSE.md',
    to: 'lib/license/Marked License.txt'
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
    to: 'lib/license/KaTeX License.txt'
  }
];

const dir = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(path.join(dir, 'lib', 'katex', 'fonts'), { recursive: true });
fs.mkdirSync(path.join(dir, 'lib', 'license'), { recursive: true });
for (const file of filesToCopy) {
  try {
    const src = path.join(dir, file.from);
    const dest = path.join(dir, file.to);
    fs.copyFileSync(src, dest);
    console.log(src + " => " + dest);
  } catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}

// KaTeX字体文件
const fontsSrcDir = path.join(dir, 'node_modules/katex/dist/fonts');
const fontsDestDir = path.join(dir, 'lib/katex/fonts');
fs.mkdirSync(path.join(dir, 'lib', 'katex', 'fonts'), { recursive: true });
for (const fontFile of fs.readdirSync(fontsSrcDir)) {
  const src = path.join(fontsSrcDir, fontFile);
  const dest = path.join(fontsDestDir, fontFile);
  fs.copyFileSync(src, dest);
  console.log(src + " => " + dest);
}
