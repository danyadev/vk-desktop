'use strict';

let getTagData = (name, text) => {
  let regexp = new RegExp(`<${name}>([^]*)</${name}>`, 'i');

  return (text.match(regexp) || [])[1] || '';
}

require.extensions['.vue'] = (module, filename) => {
  let file = fs.readFileSync(filename, 'utf-8');

  let code = `
    (function(){'use strict';${getTagData('script', file)}})();
    module.exports.template = ${JSON.stringify(getTagData('template', file))};
  `;

   module._compile(code, filename);
}

let getFiles = (path, files = [], folders = '') => {
  fs.readdirSync(`${path}${folders}`, { withFileTypes: true })
    .forEach((file) => {
      if(!file.isDirectory()) files.push(`${folders}${file.name}`);
      else files.concat(getFiles(path, files, `${folders}${file.name}/`));
    });

  return files;
}

getFiles('./renderer/components/')
  .map((file) => file.slice(0, -4))
  .forEach((filename) => {
    let name = filename.slice(filename.lastIndexOf('/') + 1),
        component = require(`./../components/${filename}.vue`);

    Vue.component(name, component);
});
