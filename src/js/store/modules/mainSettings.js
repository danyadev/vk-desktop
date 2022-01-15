import { mainSettingsStorage } from '../Storage';

export default {
  namespaced: true,

  state: mainSettingsStorage.data,

  mutations: {
    updateSettings(state, settings) {
      Object.assign(state, settings);
    }
  }
};
