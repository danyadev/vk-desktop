'use strict';

// превращает emoji символы в картинку как в ВК
Vue.directive('emoji', (el, { modifiers }, vnode) => {
  let elem = vnode.children ? vnode.children[0] : el,
      html = elem.text || other.getTextWithEmoji(elem.childNodes);

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

  if(!modifiers.no_emoji) el.innerHTML = emoji(html);
});

let getTagData = (name, text) => {
  let regexp = new RegExp(`<${name}>([^]*)</${name}>`, 'i');

  return (text.match(regexp) || [])[1] || '';
}

require.extensions['.vue'] = (module, filename) => {
  let file = fs.readFileSync(filename, 'utf-8'),
      template = JSON.stringify(getTagData('template', file));

  let code = `
    ${'\n'.repeat(template.split('\\n').length-1)}
    ${getTagData('script', file)}
    module.exports.template = ${template};
  `;

   module._compile(code, filename);
}

let getFiles = (path, files = [], folders = '') => {
  let items = fs.readdirSync(`${path}${folders}`, { withFileTypes: true });

  for(let file of items) {
    if(!file.isDirectory()) files.push(`${folders}${file.name}`);
    else files.concat(getFiles(path, files, `${folders}${file.name}/`));
  }

  return files;
}

getFiles(ROOT_DIR + '/components/').forEach((file) => {
  let fileType = file.slice(file.lastIndexOf('.') + 1);
  if(fileType == file || fileType != 'vue') return;

  let filename = file.slice(0, -4),
      name = filename.slice(filename.lastIndexOf('/') + 1),
      component = require(`./../components/${filename}.vue`);

  Vue.component(name, component);
});
