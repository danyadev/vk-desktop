'use strict';

module.exports = {
  state: {
    chat: null,
    list: []
  },
  mutations: {
    setChat(state, id) {
      if(id === 0) id = app.user.id;

      state.chat = id;
    }
  }
}
