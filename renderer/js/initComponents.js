'use strict';

const fs = require('fs');
const { resolve } = require('path');
const { getTextWithEmoji } = require('./../components/messages/methods');

Vue.use(require('./lib/ModalCreator'));

// превращает emoji символы в картинку как в ВК
Vue.directive('emoji', (el, { modifiers }, vnode) => {
  let elem = vnode.children ? vnode.children[0] : el,
      html = elem.text || getTextWithEmoji(elem.childNodes).text;

  if(!modifiers.br) html = html.replace(/<br>/g, ' ');

  if(modifiers.push || modifiers.color_push) {
    let to = modifiers.push ? '$3' : '<span style="color: #254f79">$3</span>';

    html = html.replace(other.regexp.push, to);
  }

  if(modifiers.link) {
    html = html
      .replace(/<br>/g, '\n')
      .replace(other.regexp.url, '<span style="color: #254f79">$1</span>')
      .replace(/\n/g, '<br>');
  }

  el.innerHTML = emoji(html);
});

let getTagData = (name, text) => {
  let regexp = new RegExp(`<${name}>([^]*)</${name}>`, 'i'),
      match = text.match(regexp);

  return match ? match[1] : '';
}

require.extensions['.vue'] = (module, filename) => {
  let file = fs.readFileSync(filename, 'utf-8'),
      template = JSON.stringify(getTagData('template', file));

  let code = `
    'use strict';
    ${'\n'.repeat(template.split('\\n').length-1)}
    ${getTagData('script', file) || 'module.exports = {};'}
    module.exports.template = ${template};
  `.trim();

   module._compile(code, filename);
}

let getFiles = (path, files = [], folders = '') => {
  let items = fs.readdirSync(path + folders, { withFileTypes: true });

  for(let file of items) {
    if(!file.isDirectory()) files.push(folders + file.name);
    else files.concat(getFiles(path, files, `${folders}${file.name}/`));
  }

  return files;
}

let componentsPath = resolve(__dirname, '..', 'components') + '/';

getFiles(componentsPath).forEach((file) => {
  let fileType = file.slice(file.lastIndexOf('.') + 1);
  if(fileType == file || fileType != 'vue') return;

  let name = file.slice(file.lastIndexOf('/') + 1).slice(0, -4),
      component = require(`./../components/${file}`);

  Vue.component(name, component);
});
