'use strict';

const getTemplate = (name) => fs.readFileSync(`renderer/templates/${name}.html`, 'utf-8');

let createComponent = (name) => {
  let data = Object.assign({
    template: getTemplate(name)
  }, require(`./components/${name}`));

  Vue.component(name, data);
}

// Форма авторизации
createComponent('auth');
