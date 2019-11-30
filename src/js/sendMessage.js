import { random, eventBus, createModalWindow } from './utils';
import store from './store';
import vkapi from './vkapi';
import Vue from 'vue';

let counter = 0;

function parseInputText(nodes) {
  let text = '';

  for(const node of nodes || []) {
    if(node.nodeName == '#text') text += node.data;
    else if(node.nodeName == 'BR') text += '<br>';
    else if(node.nodeName == 'IMG') text += node.alt;
    else text += node.innerText;
  }

  return text.replace(/\n/g, '').replace(/<br>/g, '\n').trim().replace(/\n/g, '<br>');
}

export default async function sendMessage({ peer_id, input, keyboard }) {
  const random_id = random(-2e9, 2e9);
  let message;

  if(keyboard) {
    const { author_id, action, one_time } = keyboard;
    // Почему-то в группах приходит screen_name вместо domain
    const { screen_name } = store.state.profiles[author_id];

    message = peer_id > 2e9 ? `@${screen_name} ${action.label}` : action.label;

    if(one_time) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          keyboard: {}
        }
      });
    }
  } else {
    message = parseInputText(input.childNodes);
  }

  if(!message) return;
  if(input) input.innerHTML = '';

  try {
    store.commit('messages/addLoadingMessage', {
      peer_id,
      msg: {
        id: 'loading' + counter++, // используется только как key для Vue
        text: message,
        from: store.getters['users/user'].id,
        date: (Date.now() / 1000).toFixed(),
        out: true,
        editTime: 0,
        fwdCount: 0,
        fwdMessages: [],
        attachments: [],
        random_id,
        isLoading: true
      }
    });

    await Vue.nextTick();

    eventBus.emit('messages:jumpTo', {
      peer_id,
      bottom: true,
      mark: false
    });

    await vkapi('messages.send', {
      peer_id,
      message,
      random_id,
      payload: keyboard && keyboard.action.payload
    });
  } catch(e) {
    store.commit('messages/editLoadingMessage', {
      peer_id,
      random_id,
      isLoadingFailed: true
    });

    // 900 = Нельзя отправить пользователю из черного списка
    // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
    if([900, 902].includes(e.error_code)) {
      return store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          canWrite: false
        }
      });
    }

    // Требуется активировать аккаунт
    if(e.error_code == 17) {
      createModalWindow(e.redirect_uri);
    }
  }
}
