import { nextTick } from 'vue';
import { random, eventBus } from './utils';
import { isChatPeerId } from './api/ranges';
import { addSnackbar } from './snackbars';
import vkapi from './vkapi';
import store from './store';

let counter = 0;

function parseInputText(nodes) {
  let text = '';

  for (const node of nodes || []) {
    if (node.nodeName === '#text') text += node.data.replace(/\n/g, '');
    else if (node.nodeName === 'BR') text += '\n';
    else if (node.nodeName === 'IMG') text += node.alt;
    else text += node.innerText;
  }

  return text.trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n/g, '<br>');
}

export default async function sendMessage({
  peer_id,
  input,
  keyboardButton,
  replyMsg,
  fwdMessages = []
}) {
  const random_id = random(-2e9, 2e9);
  let message;

  if (keyboardButton) {
    const { author_id, action, one_time } = keyboardButton;
    // Почему-то в группах приходит screen_name вместо domain
    const { screen_name } = store.state.profiles[author_id];

    if (one_time) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          keyboard: {}
        }
      });
    }

    message = isChatPeerId(peer_id) ? `@${screen_name} ${action.label}` : action.label;
  } else {
    message = parseInputText(input.childNodes);
  }

  if (!message && (!fwdMessages.length || replyMsg)) {
    return false;
  }

  if (input) {
    input.innerHTML = '';
  }

  const msg_id = 'loading' + counter++;
  const payload = keyboardButton && keyboardButton.action.payload;
  const params = {
    peer_id,
    message,
    random_id
  };

  if (payload) params.payload = payload;
  if (replyMsg) params.reply_to = replyMsg.id;
  if (fwdMessages.length) {
    params.forward_messages = fwdMessages.map((msg) => msg.id).join(',');
  }

  store.commit('messages/addLoadingMessage', {
    peer_id,
    msg: {
      id: msg_id,
      from: store.state.users.activeUserID,
      out: true,
      text: message,
      date: (Date.now() / 1000).toFixed(),
      random_id,
      fwdCount: fwdMessages.length,
      fwdMessages,
      attachments: {},
      hasReplyMsg: !!replyMsg,
      replyMsg,
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

  vkapi('messages.send', params, { android: true }).catch((err) => {
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

    addSnackbar({
      text: `Error ${err.error_code}. ${err.error_msg}`,
      icon: 'error',
      color: 'var(--icon-red)'
    });
  });

  return true;
}
