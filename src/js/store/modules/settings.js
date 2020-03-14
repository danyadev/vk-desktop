import { settingsStorage } from '../Storage';
import ru from 'src/lang/ru';

const languages = {
  ru
};

export default {
  namespaced: true,

  state: settingsStorage.data,

  mutations: {
    setWindowBounds(state, bounds) {
      state.window = bounds;
    }
  },

  getters: {
    lang({ langName }) {
      if (langName === 'ru') {
        return ru;
      }

      return {
        ...ru,
        ...languages[langName]
      };
    }
  }
};
