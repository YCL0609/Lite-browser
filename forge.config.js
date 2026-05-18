import { MakerZIP } from '@electron-forge/maker-zip';
import path from 'node:path';
import fs from 'node:fs';

export default {
  packagerConfig: {
    icon: 'extrares/icons/icon',
    asar: true,
    extraResource: [
      'extrares/icons',
      'extrares/license'
    ],
    ignore: [
      /node_modules/,
      /resources/,
      /\.vscode/,
      /out/,
      /\.git/,
      /package-lock\.json$/,
      /README_ZH\.md$/,
      /\.gitignore$/,
      /getlibs\.js$/,
      /README\.md$/,
      /LICENSE$/,
      /forge.config.js$/
    ]
  },
  makers: [new MakerZIP({})],
  hooks: {
    postMake: async (forgeConfig, makeResults) => {
      for (const result of makeResults) {
        const sysList = {
          win32: 'windows',
          darwin: 'macos',
          linux: 'linux'
        };

        // 确定系统标识
        const sys = sysList[result.platform] || result.platform;
        const newBaseName = `lite-browser-${sys}-${result.arch}`;
        for (const artifactPath of result.artifacts) {
          const ext = path.extname(artifactPath);
          if (ext === '.zip') {
            const dir = path.dirname(artifactPath);
            const newPath = path.join(dir, `${newBaseName}${ext}`);

            try {
              if (fs.existsSync(artifactPath)) fs.renameSync(artifactPath, newPath);
            } catch (err) {
              console.error(err.stack);
            }
          }
        }
      }
    }
  }
};