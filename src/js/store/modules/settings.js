import { settings } from '../Storage';

function getLangFile(name) {
  const lang = require(`js/../lang/${name}.js`).default;

  if(name != 'ru') return Object.assign(getLangFile('ru'), lang);
  else return lang;
}

export default {
  state: settings.data,
  mutations: {
    setWindowBounds(state, bounds) {
      state.window = bounds;
    },
    setTheme(state, name) {
      state.theme = name;
    }
  },
  getters: {
    lang({ langName }) {
      return getLangFile(langName);
    }
  }
}
