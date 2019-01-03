'use strict';

const { loadProfile } = require('./../../components/messages/methods');

module.exports = {
  peers(state) {
    return state.peersList.map(({ id }) => {
      return state.conversations[id].peer;
    });
  },
  lastMessage: (state, getters) => (peerID) => {
    let dialog = state.conversations[peerID];
    if(dialog) return dialog.lastMsg;
  },
  typingMsg: (state) => (peerID) => {
    let text = [], audio = [], msg = '';

    for(let id in state.typing[peerID]) {
      if(state.typing[peerID][id].type == 'audio') audio.push(id);
      else text.push(id);
    }

    let name = (id) => {
      // если это лс, то просто писать "печатает"
      if(peerID < 2e9) return '';

      let user = state.profiles[id];
      if(!user || !user.photo_50) return loadProfile(id), '...';

      let last_sym = user.last_name ? user.last_name[0] + '.' : '';
      return user.name || `${user.first_name} ${last_sym}`;
    }

    if(text.length) {
      switch(text.length) {
        case 1:
          msg = app.l('im_typing_text', 0, [name(text[0])]);
          break;
        case 2:
          msg = app.l('im_typing_text', 1, [name(text[0]), name(text[1])]);
          break;
        default:
          msg = app.l('im_typing_text', 2, [name(text[0]), text.length-1]);
          break;
      }
    }

    if(audio.length) {
      if(text.length) msg += ` ${app.l('and')} `;

      switch(audio.length) {
        case 1:
          msg += app.l('im_typing_audio', 0, [name(audio[0])]);
          break;
        case 2:
          msg += app.l('im_typing_audio', 1, [name(audio[0]), name(audio[1])]);
          break;
        default:
          msg += app.l('im_typing_audio', 2, [name(audio[0]), audio.length-1]);
          break;
      }
    }

    return msg;
  }
}
