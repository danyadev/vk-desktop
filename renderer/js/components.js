'use strict';

const getTemplate = (name) => fs.readFileSync(`${__dirname}/../templates/${name}.html`, 'utf-8');

let createComponent = (name) => {
  let params = {};

  try {
    params = require(`./components/${name}`);
  } catch(e) {}

  let data = Object.assign({
    template: getTemplate(name)
  }, params);

  Vue.component(name, data);
}

// Форма авторизации
createComponent('auth');

// Меню
createComponent('main-menu');

// Страница профиля
createComponent('profile');

// Страница новостей
createComponent('news');
