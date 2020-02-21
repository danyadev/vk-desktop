import { random, eventBus } from './utils';
import store from './store';
import vkapi from './vkapi';
import Vue from 'vue';

let counter = 0;

function parseInputText(nodes) {
  let text = '';

  for(const node of nodes || []) {
    if(node.nodeName == '#text') text += node.data.replace(/\n/g, '');
    else if(node.nodeName == 'BR') text += '\n';
    else if(node.nodeName == 'IMG') text += node.alt;
    else text += node.innerText;
  }

  return text.trim().replace(/\n/g, '<br>');
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
    const msg_id = 'loading' + counter++;
    const payload = keyboard && keyboard.action.payload;
    const params = {
      peer_id,
      message,
      random_id,
      ...(payload ? { payload } : {})
    };

    store.commit('messages/addLoadingMessage', {
      peer_id,
      msg: {
        id: msg_id,
        text: message,
        from: store.state.users.activeUser,
        date: (Date.now() / 1000).toFixed(),
        out: true,
        editTime: 0,
        fwdCount: 0,
        fwdMessages: [],
        attachments: [],
        random_id,
        isLoading: true,
        params
      }
    });

    await Vue.nextTick();

    eventBus.emit('messages:event', 'jump', {
      msg_id,
      peer_id,
      bottom: true,
      mark: false
    });

    await vkapi('messages.send', params);
  } catch(e) {
    store.commit('messages/editLoadingMessage', {
      peer_id,
      random_id,
      error: true
    });

    // 900 = Нельзя отправить пользователю из черного списка
    // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
    if([900, 902].includes(e.error_code)) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          canWrite: false
        }
      });
    }
  }
}
