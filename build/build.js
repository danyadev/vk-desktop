const builder = require('electron-builder');
const { Platform } = builder;

builder.build({
  targets: Platform.current().createTarget(),
  config: {
    appId: 'ru.danyadev.vkdesktop',
    electronVersion: '4.0.4',
    productName: 'VK Desktop',
    npmRebuild: false,
    directories: { output: 'out' },
    files: ['dist/**', 'index.js', 'menu.js'],
    nsis: {
      oneClick: false,
      perMachine: true,
      allowToChangeInstallationDirectory: true,
      uninstallDisplayName: 'VK Desktop'
    },
    mac: {
      category: 'public.app-category.social-networking',
      target: 'dmg'
    },
    linux: {
      synopsis: 'Клиент ВКонтакте',
      category: 'Network',
      target: 'AppImage'
    }
  }
}).then((...data) => {
  console.log('SUCCESS\n\n', ...data);
}).catch((...data) => {
  console.log('ERROR\n\n', ...data);
});
