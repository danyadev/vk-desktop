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

fs.readdirSync('./renderer/components/')
  .map((file) => file.slice(0, -4))
  .forEach((name) => {
    let component = require(`./../components/${name}.vue`);

    Vue.component(name, component);
});
