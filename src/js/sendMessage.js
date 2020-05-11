import { nextTick } from 'vue';
import { random, eventBus } from './utils';
import store from './store';
import vkapi from './vkapi';

let counter = 0;

function parseInputText(nodes) {
  let text = '';

  for (const node of nodes || []) {
    if (node.nodeName === '#text') text += node.data.replace(/\n/g, '');
    else if (node.nodeName === 'BR') text += '\n';
    else if (node.nodeName === 'IMG') text += node.alt;
    else text += node.innerText;
  }

  return text.trim().replace(/\n/g, '<br>');
}

function getMessage(peer_id, msg_id) {
  const messages = store.state.messages.messages[peer_id];
  return messages && messages.find((msg) => msg.id === msg_id);
}

export default async function sendMessage({ peer_id, input, keyboard, reply_to }) {
  const random_id = random(-2e9, 2e9);
  let message;

  if (keyboard) {
    const { author_id, action, one_time } = keyboard;
    // Почему-то в группах приходит screen_name вместо domain
    const { screen_name } = store.state.profiles[author_id];

    message = peer_id > 2e9 ? `@${screen_name} ${action.label}` : action.label;

    if (one_time) {
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

  if (!message) {
    return;
  }

  if (input) {
    input.innerHTML = '';
  }

  try {
    const msg_id = 'loading' + counter++;
    const payload = keyboard && keyboard.action.payload;
    const params = {
      peer_id,
      message,
      random_id
    };

    if (payload) params.payload = payload;
    if (reply_to) params.reply_to = reply_to;

    store.commit('messages/addLoadingMessage', {
      peer_id,
      msg: {
        id: msg_id,
        from: store.state.users.activeUser,
        out: true,
        text: message,
        date: (Date.now() / 1000).toFixed(),
        random_id,
        fwdCount: 0,
        fwdMessages: [],
        attachments: {},
        hasReplyMsg: !!reply_to,
        replyMsg: reply_to && getMessage(peer_id, reply_to),
        editTime: 0,

        isLoading: true,
        params
      }
    });

    await nextTick();

    eventBus.emit('messages:event', 'jump', {
      msg_id,
      peer_id,
      bottom: true,
      noSmooth: true
    });

    await vkapi('messages.send', params, { android: true });
  } catch (err) {
    store.commit('messages/editLoadingMessage', {
      peer_id,
      random_id,
      error: true
    });

    // 900 = Нельзя отправить пользователю из черного списка
    // 902 = Нельзя отправить сообщение из-за настроек приватности собеседника
    if ([900, 902].includes(err.error_code)) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          isWriteAllowed: false
        }
      });
    }
  }
}
