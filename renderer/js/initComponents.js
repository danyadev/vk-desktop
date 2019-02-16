'use strict';

const fs = require('fs');
const path = require('path');

Vue.use(require('./lib/ModalCreator'));
Vue.config.devtools = true;

Vue.config.errorHandler = function(stack, vm, type) {
  app.$modals.open('error-handler', {
    stack: stack.stack,
    type,
    tag: vm.$vnode.tag.split('-')[3]
  });
}

Vue.directive('emoji', (el, { value = '', modifiers }) => {
  let html = value;

  if(!modifiers.br) html = html.replace(/<br>/g, ' ');

  if(modifiers.push || modifiers.color_push) {
    let to = modifiers.push ? '$3' : '<span class="link">$3</span>';

    html = html.replace(utils.regexp.push, to);
  }

  if(modifiers.link) {
    html = html
      .replace(/<br>/g, '\n')
      .replace(utils.regexp.url, '<span class="link">$1</span>')
      .replace(/\n/g, '<br>');
  }

  if(el.innerHTML != html) el.innerHTML = emoji(html);
});

function getWordEnding(num) {
  let num1 = Math.abs(num) % 100,
      num2 = num1 % 10;

  if(num1 > 10 && num1 < 20) return 2;
  if(num2 > 1 && num2 < 5) return 1;
  if(num2 == 1) return 0;

  return 2;
}

Vue.prototype.l = function(name, key, replaces, number) {
  if(Array.isArray(key)) {
    number = replaces;
    replaces = key;
    key = null;
  }

  if(typeof key == 'boolean') key = key ? 1 : 0;
  if(number != undefined) key = getWordEnding(number);

  let data = this.$store.getters['settings/lang'][name];
  if(![null, undefined].includes(key)) data = data[key];

  if(Array.isArray(replaces)) {
    for(let i in replaces) {
      let regexp = new RegExp(`\\{${i}\\}`, 'g');

      data = String(data).replace(regexp, replaces[i]);
    }
  }

  return data;
}

function getTagData(name, text)  {
  let regexp = new RegExp(`<${name}>([^]*)</${name}>`, 'i'),
      match = text.match(regexp);

  return match ? match[1] : '';
}

require.extensions['.vue'] = (module, filename) => {
  let file = fs.readFileSync(filename, 'utf-8'),
      template = JSON.stringify(getTagData('template', file));

  let code = `'use strict';
    ${'\n'.repeat(template.split('\\n').length-1)}
    ${getTagData('script', file) || 'module.exports = {};'}
    module.exports.template = ${template};
  `.trim();

   module._compile(code, filename);
}

function getFiles(dir, fileList = [], origDir = dir) {
  let files = fs.readdirSync(dir);

  files.forEach((file) => {
    if(!fs.statSync(path.join(dir, file)).isDirectory()) {
      let filePath = path.join(dir, file).replace(origDir, '').slice(1);

      fileList.push(filePath);
    } else {
      fileList = getFiles(path.join(dir, file), fileList, origDir);
    }
  });

  return fileList;
}

let componentsPath = path.resolve(__dirname, '..', 'components');

getFiles(componentsPath).forEach((file) => {
  file = file.replace(/\\/g, '/');

  let fileType = file.slice(file.lastIndexOf('.') + 1);
  if(fileType == file || fileType != 'vue') return;

  let name = file.slice(file.lastIndexOf('/') + 1).slice(0, -4),
      component = require(`./../components/${file}`);

  Vue.component(name, component);
});
