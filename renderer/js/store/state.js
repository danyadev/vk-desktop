'use strict';

function getLangFile(name) {
  return require(`./../../lang/${name}.js`);
}

module.exports = () => ({
  users: Object.assign({}, users.get()),
  activeUser: settings.get('activeUser'),
  settings: settings.get(),
  menuState: false,
  profiles: {},
  conversations: {},
  peersList: [],
  typing: {},
  activeChat: null,
  messages: {},
  langName: settings.get('lang'),
  lang: getLangFile(settings.get('lang'))
});
