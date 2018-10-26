'use strict';

window.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const qs = (selector, target) => (target || document).querySelector(selector);
const qsa = (selector, target) => (target || document).querySelectorAll(selector);
const getComponent = (n) => app.$children.find((c) => c.$options._componentTag == n);

const fs = require('fs');
const { getCurrentWindow, Menu, BrowserWindow } = require('electron').remote;
const Vue = require('./js/lib/Vue');
const contextMenu = require('./js/contextMenu');
const { users, settings } = require('./js/Storage');
const vkapi = require('./js/vkapi');

// Включение всех компонентов
fs.readdir('./renderer/components/', (error, data) => {
  const VueCompiler = require('./js/lib/vue-compiler');

  require.extensions['.vue'] = (module, path) => {
    let file = fs.readFileSync(path, 'utf-8'),
        { script, template } = VueCompiler.parseComponent(file),
        { render, staticRenderFns, errors } = VueCompiler.compile(template ? template.content : '');

    for(let error of errors) throw Error(error);

    let result = `
    (function(){'use strict';${script ? script.content : ''}})();
    exports.render = function(){${render}};
    exports.staticRenderFns = [${staticRenderFns.map(code => `function(){${code}}`).join(',')}];`;

     module._compile(result, path);
  };

  data.map((file) => file.slice(0, -4)).forEach((name) => {
    let component = require(`./components/${name}.vue`);

    Vue.component(name, component);
  });
});

let app = new Vue({
  el: '.root',
  data: {
    auth: !settings.get('activeID'),
    blocked: false
  }
});

contextMenu.set(document.body, (e) => {
  return [{
    label: 'Открыть в DevTools',
    click: (temp, win) => win.inspectElement(e.x, e.y)
  }];
});

if(process.platform == 'darwin') {
  qs('.titlebar').classList.add('mac');

  qs('.titlebar_drag').addEventListener('dblclick', () => {
    if(getCurrentWindow().isFullScreen()) return;

    getCurrentWindow().emit(getCurrentWindow().isMaximized() ? 'unmaximize' : 'maximize');
  });
}

getCurrentWindow().on('maximize', () => qs('.titlebar').classList.add('maximized'));
getCurrentWindow().on('unmaximize', () => qs('.titlebar').classList.remove('maximized'));
getCurrentWindow().emit(getCurrentWindow().isMaximized() ? 'maximize' : 'unmaximize');

['minimize', 'maximize', 'restore', 'close'].forEach((name) => {
  qs(`.titlebar_button.${name}`).addEventListener('click', () => getCurrentWindow()[name]());
});

window.addEventListener('beforeunload', () => {
  getCurrentWindow().removeAllListeners();

  BrowserWindow.getAllWindows().forEach((win) => {
    if(win != getCurrentWindow()) win.destroy();
  });

  settings.set('window', getCurrentWindow().getBounds());
});
