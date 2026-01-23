import { MakerZIP } from '@electron-forge/maker-zip';

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
      /README_EN\.md$/,
      /\.gitignore$/,
      /getlibs\.js$/,
      /README\.md$/,
      /LICENSE$/,
      /forge.config.js$/
    ]
  },

  makers: [
    new MakerZIP({
      name: (_forgeConfig, platform, arch) => {
        const platformMap = {
          win32: 'windows',
          darwin: 'macos',
          linux: 'linux'
        };

        const sys = platformMap[platform] || platform;
        return `lite-browser-${arch}-${sys}`;
      }
    })
  ]
};
