import { MakerZIP } from '@electron-forge/maker-zip';

export default {
  packagerConfig: {
    icon: 'extrares/icons/icon',
    asar: true,

    // 复制到与 app.asar 同级
    extraResource: [
      'extrares/icons',
      'extrares/license'
    ],

    // 忽略列表
    ignore: [
      /node_modules/,
      /resources/,
      /\.vscode/,
      /out/,
      /\.git/,
      /package-lock\.json$/,
      /README_EN\.md$/,
      /\.gitignore$/,
      /getlibs\.js$/,
      /README\.md$/,
      /LICENSE$/,
      /forge.config.js$/
    ]
  },

  makers: [
    new MakerZIP({})
  ]
};
