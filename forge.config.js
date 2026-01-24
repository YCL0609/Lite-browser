import { MakerZIP } from '@electron-forge/maker-zip';
import path from 'path';
import fs from 'fs';

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
    postMake: async (_, results) => {
      for (const result of results) {
        const sysList = {
          win32: 'windows',
          darwin: 'macos',
          linux: 'linux'
        };
        const sys = sysList[result.platform] ? sysList[result.platform] : result.platform
        const newBaseName = `lite-browser-${sys}-${result.arch}`;
        for (let i = 0; i < result.artifacts.length; i++) {
          const artifactPath = result.artifacts[i];
          const ext = path.extname(artifactPath);
          if (ext === '.zip') {
            const dir = path.dirname(artifactPath);
            const newPath = path.join(dir, `${newBaseName}${ext}`);
            fs.renameSync(artifactPath, newPath);
          }
        }
      }
    }
  }
};
