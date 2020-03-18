export default {
  state: {
    isMenuOpened: false,
    menuCounters: {}
  },

  mutations: {
    setMenuState(state, value) {
      state.isMenuOpened = value;
    },

    setMenuCounters(state, counters) {
      state.menuCounters = counters;
    }
  }
};
