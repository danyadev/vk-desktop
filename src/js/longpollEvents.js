import electron from 'electron';
import { nextTick } from 'vue';
import { timer, eventBus } from './utils';
import {
  parseMessage,
  parseAttachments,
  parseConversation,
  loadConversation,
  loadConversationMembers,
  addNotificationsTimer,
  activeKeyboardCallbackButtons
} from './messages';
import { supportedAttachments } from '../components/messages/chat/attachments';
import vkapi from './vkapi';
import store from './store';
import router from './router';
import debug from './debug';

const messageFlagsMap = {
  unread:         1 << 0,  // Непрочитанное сообщение
  outbox:         1 << 1,  // Исходящее сообщение
  important:      1 << 3,  // Важное сообщение
  chat_vkcom:     1 << 4,  // Отправка сообщения в беседу через vk.com
  friends:        1 << 5,  // Исходящее; входящее от друга в лс
  spam:           1 << 6,  // Пометка сообщения как спам
  deleted:        1 << 7,  // Удаление сообщения локально
  audio_listened: 1 << 12, // Прослушано голосовое сообщение
  chat:           1 << 13, // Отправка сообщения в беседу
  cancel_spam:    1 << 15, // Отмена пометки как спам
  old_minor_id:   1 << 16, // Сообщение не поднимает диалог вверх
  deleted_all:    1 << 17, // Удаление сообщения для всех
  not_delivered:  1 << 18, // Внутренний флаг (приходит вместе с бизнес-уведомлением)
  chat_in:        1 << 19, // Входящее сообщение в беседе
  silent:         1 << 20, // Сообщение без уведомления
  reply_msg:      1 << 21, // Ответ на сообщение
  auto_read:      1 << 23, // Сообщение пришло сразу прочитанным
  has_ttl:        1 << 26  // Внутренний флаг (приходит вместе с бизнес-уведомлением)
};

const conversationFlagsMap = {
  push_disabled:              1 << 4,  // Беседа замьючена
  sound_disabled:             1 << 5,  // Звук в беседе выключен (сомнительный флаг)
  incoming_message_request:   1 << 8,  // Входящий запрос на переписку / вступление в беседу
  rejected_message_request:   1 << 9,  // Отклоненный запрос на переписку / вступление в беседу
  has_mention:                1 << 10, // Наличие упоминания
  no_search:                  1 << 11, // Не отображать беседу при поиске
  special_service:            1 << 12, // Внутренний флаг
  business_notification:      1 << 13, // Бизнес-уведомление
  has_marked_message:         1 << 14, // Наличие маркированного сообщения
  casper_chat:                1 << 16, // Фантомный чат
  massmentions_push_disabled: 1 << 18, // Не присылать уведомлений о @all и @online
  mentions_push_disabled:     1 << 19, // Не присылать уведомлений о всех упоминаниях
  marked_as_unread:           1 << 20, // Беседа помечена как непрочитанная
  message_request:            1 << 22, // Беседа в статусе входящего запроса на переписку
  has_active_call:            1 << 24, // Беседа, в которой идет звонок
  is_chat:                    1 << 26  // Признак того, что это чат
};

function hasFlag(mask, flags = messageFlagsMap) {
  return (flag) => !!(flags[flag] & mask);
}

function getAllFlags(mask, flags = messageFlagsMap) {
  const flagToName = Object.fromEntries(
    Object.entries(flags).map(([a, b]) => [b, a])
  );

  return mask
    .toString(2)
    .split('')
    .reverse()
    .map((value, index) => value * 2 ** index)
    .filter(Boolean)
    .map((flag) => flagToName[flag] || flag);
}

function getServiceMessage(data) {
  const source = {};

  const replaces = {
    act: 'type',
    mid: 'member_id',
    chat_local_id: 'conversation_message_id'
  };

  for (const item in data) {
    const match = item.match(/source_(.+)/);

    if (match) {
      const key = replaces[match[1]] || match[1];

      source[key] = isNaN(data[item])
        ? data[item]
        : +data[item];
    }
  }

  return Object.keys(source).length
    ? source
    : null;
}

function getAttachments(data) {
  const attachments = {};

  const loadedAttachments = data.attachments
    ? parseAttachments(JSON.parse(data.attachments))
    : {};

  if (data.geo) {
    attachments.geo = [null];
  }

  for (const key in data) {
    const match = key.match(/attach(\d+)$/);

    if (match) {
      const id = match[1];
      const kind = data[`attach${id}_kind`];
      let type = data[`attach${id}_type`];

      if (kind === 'audiomsg') type = 'audio_message';
      if (kind === 'graffiti') type = 'graffiti';
      if (type === 'group') type = 'event';

      if (loadedAttachments[type]) {
        attachments[type] = loadedAttachments[type];
      } else {
        (attachments[type] || (attachments[type] = [])).push(null);
      }
    }
  }

  return attachments;
}

// https://github.com/danyadev/longpoll-doc#структура-сообщения
function parseLongPollMessage(data) {
  // Иногда прилетает массив только с msg_id и flags
  // TODO: научиться обрабатывать такие случаи
  if (data.length === 2) {
    console.error('[lp] invalid message', data);
    debug('[longpoll parseError] ' + JSON.stringify(data));
    return;
  }

  const activeUser = store.getters['users/user'];
  const flag = hasFlag(data[1]);
  const action = getServiceMessage(data[5]);
  const from_id = flag('outbox') ? activeUser.id : +(data[5].from || data[2]);
  // flag('outbox') возвращает false, когда пишешь сообщение в свой же лс
  const out = from_id === activeUser.id;
  const { keyboard, marked_users } = data[5];
  const attachments = getAttachments(data[6]);
  const hasReplyMsg = flag('reply_msg');
  const hasAttachment = !!(hasReplyMsg || data[6].fwd || Object.keys(attachments).length);
  const messagesList = store.state.messages.messages[data[2]];
  let replyMsg = null;
  let mentions = [];

  if (keyboard) {
    keyboard.author_id = from_id;
  }

  for (const [id, users] of marked_users || []) {
    if (id === 1) {
      mentions = (users === 'all' ? [activeUser.id] : users);
    }

    // type 2 = бомбочка
  }

  if (data[6].reply && messagesList) {
    const reply_id = JSON.parse(data[6].reply).conversation_message_id;
    const msg = messagesList.find((msg) => msg.conversation_msg_id === reply_id);

    if (msg) {
      replyMsg = msg;
    }
  }

  return {
    peer: {
      id: data[2],
      isChannel: (
        // Сообщение от повторного вступления в канал
        !out && flag('deleted') ||
        // Сообщение с chat_title_update или chat_photo_remove
        !!data[5].source_is_channel
      ),
      isCasperChat: !!data[5].ttl,
      keyboard: keyboard && !keyboard.inline && keyboard,
      mentions
    },
    msg: {
      id: data[0],
      from: from_id,
      out,
      text: action ? '' : data[4],
      date: data[3],
      peer_id: data[2],
      conversation_msg_id: data[8],
      random_id: data[7],
      action,
      hasAttachment,
      fwdCount: !hasReplyMsg && data[6].fwd ? -1 : 0,
      fwdMessages: [],
      attachments,
      hasReplyMsg,
      replyMsg,
      keyboard: keyboard && keyboard.inline ? keyboard : null,
      hasTemplate: !!data[5].has_template,
      template: null,
      hidden: flag('old_minor_id'),
      editTime: data[9],
      was_listened: false,
      isContentDeleted: !data[4] && !action && !hasAttachment,
      expireTtl: +data[5].expire_ttl || data[5].ttl || 0,
      isExpired: !!data[5].is_expired,
      fromLongPoll: true
    }
  };
}

async function getAndUpdateConversation(peer_id) {
  const { message, conversation } = await vkapi('execute.getLastMessage', {
    peer_id,
    func_v: 2
  });

  const peer = parseConversation(conversation);
  const msg = message && parseMessage(message);

  store.commit('messages/updateConversation', {
    removeMsg: !msg,
    peer,
    msg
  });

  return { peer, msg };
}

async function loadMessages(peer_id, msg_ids, onlyReturnMessages) {
  const { items } = await vkapi('messages.getById', {
    message_ids: msg_ids.join(',')
  });

  const messages = [];

  for (const msg of items) {
    const parsedMsg = parseMessage(msg);

    if (onlyReturnMessages) {
      messages.push(parsedMsg);
    } else {
      store.commit('messages/editMessage', {
        peer_id,
        msg: parsedMsg
      });
    }
  }

  return messages;
}

// Проверяет, есть ли поддерживаемое вложение в сообщении,
// чтобы в дальнейшем его получить через API
function hasSupportedAttachments(msg) {
  if (msg.hasReplyMsg && !msg.replyMsg || msg.fwdCount || msg.hasTemplate) {
    return true;
  }

  for (const attach in msg.attachments) {
    // > !msg.attachments[attach][0]
    // Если LP вернул в ответе объект вложения, то получать это вложение
    // через API уже нет необходимости, поэтому его мы пропускаем
    if (supportedAttachments.has(attach) && !msg.attachments[attach][0]) {
      return true;
    }
  }

  return false;
}

// Проверяет, есть ли в одном из сообщений поддерживаемое вложение
function hasPreloadMessages(items) {
  return items.some(({ msg }) => hasSupportedAttachments(msg));
}

async function watchTyping(peer_id, user_id) {
  await timer(1000);

  const typingPeer = store.state.messages.typing[peer_id];
  const user = typingPeer && typingPeer[user_id];

  if (user && user.time) {
    store.commit('messages/addUserTyping', {
      peer_id,
      user_id,
      type: user.type,
      time: user.time - 1
    });

    return watchTyping(peer_id, user_id);
  }

  store.commit('messages/removeUserTyping', { peer_id, user_id });
}

function removeTyping(peer_id, user_id, clearChat) {
  const typing = store.state.messages.typing[peer_id] || {};

  if (typing[user_id] || clearChat) {
    store.commit('messages/removeUserTyping', {
      clearChat,
      peer_id,
      user_id
    });
  }
}

function typingHandler(peer_id, ids, type) {
  for (const id of ids) {
    if (id === store.state.users.activeUserID) {
      continue;
    }

    store.commit('messages/addUserTyping', {
      type,
      peer_id,
      user_id: id
    });

    watchTyping(peer_id, id);
  }
}

export default {
  2: {
    // 1) Пометка важным (important)
    // 2) Пометка как спам (spam)
    // 3) Удаление сообщения (deleted)
    // 4) Прослушка голосового сообщения (audio_listened)
    // 5) Удаление для всех (deleted, deleted_all)
    // [msg_id, flags, peer_id]
    pack: true,
    parser(data) {
      const flag = hasFlag(data[1]);

      // Так как в handler обрабатываются только пачки удаленных
      // сообщений, я решил обработать audio_listened здесь.
      if (flag('audio_listened')) {
        return store.commit('messages/editMessage', {
          peer_id: data[2],
          msg: {
            id: data[0],
            was_listened: true
          }
        });
      }

      if (!flag('important')) {
        return data[0];
      }
    },
    async handler({ peer_id, items: msg_ids }) {
      const { peer, msg } = await getAndUpdateConversation(peer_id);
      const route = router.currentRoute.value;

      if (
        store.state.messages.selectedMessages.length &&
        route.name === 'chat' && +route.params.id === peer_id
      ) {
        for (const id of msg_ids) {
          store.commit('messages/removeSelectedMessage', id);
        }
      }

      store.commit('messages/removeMessages', { peer_id, msg_ids });

      if (msg || peer.isCasperChat) {
        store.commit('messages/moveConversation', { peer_id });

        if (msg) {
          eventBus.emit('messages:event', 'checkScrolling', { peer_id });
        }
      } else {
        store.commit('messages/updatePeersList', {
          id: peer_id,
          remove: true
        });
      }
    }
  },

  3: {
    // 1) Прочитано сообщение (unread)
    // 2) Отмена пометки важным (important)
    // 3) Отмена пометки сообщения как спам (spam, cancel_spam)
    // 4) Восстановление удаленного сообщения (deleted)
    // Приходит сообщение (пункты 3 и 4)
    // [msg_id, flags, peer_id] (пункты 1 и 2)
    pack: true,
    parser(data) {
      if (data.length === 3) {
        return;
      }

      return parseLongPollMessage(data);
    },
    preload: hasPreloadMessages,
    async handler({ peer_id, items }) {
      const conversation = store.state.messages.conversations[peer_id];
      const conversationsList = store.getters['messages/peersList'];
      const lastLocalConversation = conversationsList[conversationsList.length - 1];
      const messagesList = store.state.messages.messages[peer_id] || [];
      const [topMsg] = messagesList;
      const bottomMsg = messagesList[messagesList.length - 1];
      const { msg } = await getAndUpdateConversation(peer_id);
      const isReturnToChannel = items[0].peer.isChannel;
      let unlockUp;
      let unlockDown;

      if (isReturnToChannel) {
        unlockUp = false;
        unlockDown = false;
      } else if (!topMsg) {
        unlockUp = true;
        unlockDown = true;
      } else {
        items = items.filter((item) => {
          if (item.msg.id < topMsg.id) {
            unlockUp = true;
          } else if (item.msg.id > bottomMsg.id) {
            unlockDown = true;
          } else {
            return true;
          }
        });
      }

      if (items.length) {
        const { items: newMessages } = await vkapi('messages.getById', {
          message_ids: items.map(({ msg }) => msg.id).join(',')
        });

        for (const msg of newMessages) {
          store.commit('messages/insertMessage', {
            peer_id,
            msg: parseMessage(msg)
          });
        }
      }

      eventBus.emit('messages:event', 'checkScrolling', {
        peer_id,
        unlockUp,
        unlockDown
      });

      if (!lastLocalConversation || lastLocalConversation.msg.id < msg.id) {
        if (conversation && !store.state.messages.peerIds.includes(peer_id)) {
          store.commit('messages/updatePeersList', {
            id: peer_id
          });
        }

        store.commit('messages/moveConversation', {
          peer_id,
          isRestoreMsg: true
        });
      }

      if (isReturnToChannel) {
        await nextTick();
        eventBus.emit('messages:event', 'jump', {
          peer_id,
          bottom: true,
          noSmooth: true
        });
      }
    }
  },

  4: {
    // Новое сообщение
    // Приходит сообщение
    pack: true,
    parser: parseLongPollMessage,
    preload: hasPreloadMessages,
    async handler({ peer_id, items }, isPreload) {
      const { wasOpened, loading } = store.state.messages.peersConfig[peer_id] || {};
      const conversation = store.state.messages.conversations[peer_id];
      const localMessages = store.state.messages.messages[peer_id] || [];
      const lastLocalMsg = localMessages[localMessages.length - 1];
      let lastMsg = items[items.length - 1].msg;
      const messagesWithAttachments = [];
      const peerData = {
        id: peer_id,
        mentions: conversation && conversation.peer.mentions || []
      };

      const isChatLoadedBottom = wasOpened && (
        // Нет сообщений и они не загружаются (беседа без сообщений)
        !lastLocalMsg && !loading ||
        // Последнее загруженное сообщение совпадает с последним сообщением в беседе
        lastLocalMsg && (conversation.peer.last_msg_id === lastLocalMsg.id)
      );

      if (isChatLoadedBottom) {
        store.commit('messages/addMessages', {
          peer_id,
          addNew: true,
          messages: items
            .filter((item) => !hasPreloadMessages([item]))
            .map((item) => item.msg)
        });
      }

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          last_msg_id: lastMsg.id
        }
      });

      for (const { msg, peer: { keyboard, mentions } } of items) {
        if (isChatLoadedBottom && hasSupportedAttachments(msg)) {
          messagesWithAttachments.push(msg.id);
        }

        if (msg.action && msg.action.type === 'chat_title_update') {
          peerData.title = msg.action.text;
        }

        if (msg.out) {
          peerData.in_read = msg.id;
          peerData.unread = 0;
        } else {
          removeTyping(peer_id, msg.from);

          peerData.out_read = msg.id;

          if (keyboard) {
            peerData.keyboard = keyboard;
          }

          if (conversation) {
            peerData.unread = (conversation.peer.unread || 0) + 1;
          }

          if (mentions.includes(store.state.users.activeUserID)) {
            peerData.mentions.push(msg.id);
          }
        }
      }

      if (messagesWithAttachments.length) {
        if (isPreload) {
          const messages = await loadMessages(peer_id, messagesWithAttachments, true);

          store.commit('messages/addMessages', {
            peer_id,
            messages,
            addNew: true
          });

          lastMsg = messages[messages.length - 1];
        } else {
          loadMessages(peer_id, messagesWithAttachments);
        }
      }

      for (let i = 0; i < items.length; i++) {
        eventBus.emit('messages:event', 'new', {
          peer_id,
          random_id: items[i].msg.random_id,
          isFirstMsg: !i
        });
      }

      if (lastMsg.hidden) {
        return;
      }

      if (!store.state.messages.peerIds.includes(peer_id)) {
        store.commit('messages/addConversations', [{
          peer: peerData,
          msg: lastMsg
        }]);

        loadConversation(peer_id);
      } else {
        store.commit('messages/updateConversation', {
          peer: peerData,
          msg: lastMsg
        });
      }

      store.commit('messages/moveConversation', {
        peer_id,
        isNewMsg: true
      });
    }
  },

  5: {
    // Редактирование сообщения
    // Приходит сообщение
    parser: parseLongPollMessage,
    preload: (data) => hasPreloadMessages([data]),
    async handler({ peer, msg }, isPreload) {
      const conversation = store.state.messages.conversations[peer.id];
      const messages = store.state.messages.messages[peer.id] || [];
      const isLastMsg = conversation && conversation.msg.id === msg.id;
      const { activeUserID } = store.state.users;

      removeTyping(peer.id, msg.from);

      if (hasSupportedAttachments(msg) && messages.find((message) => message.id === msg.id)) {
        if (isPreload) {
          [msg] = await loadMessages(peer.id, [msg.id], true);
        } else {
          loadMessages(peer.id, [msg.id]);
        }
      }

      const newConversationData = {
        peer: {
          id: peer.id,
          mentions: conversation && conversation.peer.mentions || []
        }
      };

      if (isLastMsg) {
        newConversationData.msg = msg;
      }

      if (
        msg.id > (conversation && conversation.peer.in_read) && // Непрочитанное сообщение
        newConversationData.peer.mentions.includes(msg.id) && // В старом сообщении есть упоминание
        !peer.mentions.includes(activeUserID) // В новом сообщении нет упоминания
      ) {
        newConversationData.peer.mentions.splice(
          newConversationData.peer.mentions.indexOf(msg.id),
          1
        );
      }

      store.commit('messages/updateConversation', newConversationData);
      store.commit('messages/editMessage', {
        peer_id: peer.id,
        msg
      });
    }
  },

  6: {
    // Прочтение входящих сообщений до msg_id
    // [peer_id, msg_id, count]
    handler([peer_id, msg_id, count]) {
      const conversation = store.state.messages.conversations[peer_id];
      const mentions = conversation && conversation.peer.mentions || [];
      const newMentions = mentions.slice();
      const isMyDialog = peer_id === store.state.users.activeUserID;

      for (const id of mentions) {
        if (msg_id >= id) {
          newMentions.splice(newMentions.indexOf(id), 1);
        }
      }

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          unread: count,
          in_read: msg_id,
          ...(isMyDialog && { out_read: msg_id }),
          mentions: newMentions
        }
      });
    }
  },

  7: {
    // Прочтение исходящих сообщений до msg_id
    // [peer_id, msg_id, count]
    handler([peer_id, msg_id]) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          in_read: msg_id,
          out_read: msg_id
        }
      });
    }
  },

  8: {
    // Друг появился в сети
    // [-user_id, platform, timestamp, app_id]
    // platform: 1: любое приложение, 2: iphone, 3: ipad, 4: android, 5: wphone, 6: windows, 7: web
    handler([id, platform, time, app_id]) {
      if (!store.state.profiles[-id]) {
        return;
      }

      store.commit('updateProfile', {
        id: -id,
        online: true,
        online_mobile: ![6, 7].includes(platform),
        online_app: app_id,
        last_seen: { time, platform }
      });
    }
  },

  9: {
    // Друг вышел из сети
    // [-user_id, isTimeout, timestamp, app_id]
    // isTimeout: 1 - вышел по таймауту, 0 - вышел из vk.com
    handler([id, /* isTimeout */, time, app_id]) {
      if (!store.state.profiles[-id]) {
        return;
      }

      store.commit('updateProfile', {
        id: -id,
        online: false,
        online_mobile: false,
        online_app: app_id,
        last_seen: { time }
      });
    }
  },

  10: {
    // Сброс флагов беседы
    // [peer_id, flags]
    handler([peer_id, flags]) {
      if (!electron.remote.app.isPackaged) {
        const flagsList = getAllFlags(flags, conversationFlagsMap).join(', ');
        console.log('[lp flag-]', peer_id, flagsList);
      }
    }
  },

  12: {
    // Установка флагов беседы
    // [peer_id, flags]
    handler([peer_id, flags]) {
      if (!electron.remote.app.isPackaged) {
        const flagsList = getAllFlags(flags, conversationFlagsMap).join(', ');
        console.log('[lp flag+]', peer_id, flagsList);
      }
    }
  },

  13: {
    // Удаление всех сообщений в диалоге
    // [peer_id, last_msg_id]
    handler([peer_id]) {
      store.commit('messages/removeConversationMessages', peer_id);
      store.commit('messages/updatePeersList', {
        id: peer_id,
        remove: true
      });

      store.commit('messages/updateConversation', {
        peer: { id: peer_id },
        removeMsg: true
      });
    }
  },

  18: {
    // 1. Добавление сниппета к сообщению (если сообщение с ссылкой)
    // 2. "Исчезновение сообщения" - удаление всего контента с добавлением ключа is_expired: true
    // Приходит сообщение
    parser: parseLongPollMessage,
    preload: (data) => hasPreloadMessages([data]),
    async handler({ peer, msg }, isPreload) {
      const conversation = store.state.messages.conversations[peer.id];
      const fullPeer = conversation && conversation.peer;
      const route = router.currentRoute.value;

      if (isPreload) {
        [msg] = await loadMessages(peer.id, [msg.id], true);
      }

      if (fullPeer && fullPeer.last_msg_id === msg.id && msg.isExpired) {
        store.commit('messages/updateConversation', {
          peer: { id: peer.id },
          msg
        });
      }

      if (
        msg.isExpired && store.state.messages.selectedMessages.length &&
        route.name === 'chat' && +route.params.id === peer.id
      ) {
        store.commit('messages/removeSelectedMessage', msg.id);
      }

      store.commit('messages/editMessage', {
        peer_id: peer.id,
        msg
      });
    }
  },

  19: {
    // Сброс кеша сообщения или исчезновение сообщения
    // [msg_id]
    // В первом случае необходимо переполучить сообщение через API
    async handler([msg_id]) {
      const conversations = store.state.messages.messages;

      // Ждем, пока в 18 событии сообщение пометится как исчезнувшее,
      // чтобы лишний раз не получать его через API
      await timer(0);

      for (const peer_id in conversations) {
        const messages = conversations[peer_id];

        for (const msg of messages) {
          if (msg.id === msg_id) {
            return !msg.isExpired && loadMessages(+peer_id, [msg.id]);
          }
        }
      }
    }
  },

  20: {
    // Закрепление или открепление беседы
    // [peer_id, major_id, 0]
    handler([peer_id, major_id]) {
      const { pinnedPeers } = store.state.messages;

      if (major_id === 0) {
        const index = pinnedPeers.indexOf(peer_id);

        // при откреплении диалога в самом приложении беседа сразу удаляется из списка
        if (index !== -1) {
          pinnedPeers.splice(index, 1);
          store.commit('messages/moveConversation', { peer_id });
        }
      } else if (!pinnedPeers.includes(peer_id)) {
        pinnedPeers.unshift(peer_id);
      }
    }
  },

  51: {
    // Изменение данных чата
    // [chat_id]
    // Событие не используется, так как событие 52 полностью его заменяет
  },

  52: {
    // Изменение данных чата
    // [type, peer_id, extra]
    async handler([type, peer_id, extra]) {
      const isMe = extra === store.state.users.activeUserID;
      const conversation = store.state.messages.conversations[peer_id];
      const peer = conversation && conversation.peer;

      if (!peer) {
        return;
      }

      // Типы 1, 10-19, 22 не нужно обрабатывать
      // Изменение названия беседы (1) и show/hide клавиатуры (11) обрабатываются в 4 событии
      if ([1, 22].includes(type) || type >= 10 && type <= 19) {
        return;
      }

      // Пользователь покинул или был исключен из беседы
      if ([7, 8].includes(type)) {
        removeTyping(peer_id, extra, isMe);
      }

      switch (type) {
        case 2: // Изменилась аватарка беседы
        case 3: // Назначен новый администратор
        case 4: // Изменение прав в беседе
        case 9: // Разжалован администратор
          // Подождем, пока обработаются другие события по типу удаления сообщения
          // админа беседы, чтобы там не появилась лишняя метка непрочитанного сообщения
          await timer(0);
          loadConversation(peer_id);
          break;

        case 5: // Закрепление или открепление сообщения
          if (extra) {
            loadConversation(peer_id);
          } else {
            peer.pinnedMsg = null;
          }
          break;

        case 6: // Пользователь присоединился или вернулся в беседу
          if (peer.members != null) {
            peer.members++;
          }

          if (isMe) {
            peer.left = false;
            peer.isWriteAllowed = !peer.isChannel;

            if (!peer.isChannel) {
              loadConversation(peer_id);
              loadConversationMembers(peer.id, true);
            }
          }
          break;

        case 7: // Пользователь покинул беседу
          if (peer.members != null) {
            peer.members--;
          }

          if (isMe) {
            peer.left = true;
          }
          break;

        case 8: // Пользователя исключили из беседы
          if (peer.members != null) {
            peer.members--;
          }

          if (isMe) {
            peer.left = true;
            peer.isWriteAllowed = false;
          }
          break;

        default:
          console.warn('[lp] Неизвестное действие в 52 событии:', { type, peer_id, extra });
      }

      store.commit('messages/updateConversation', { peer });
    }
  },

  63: {
    // Статус набора сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    handler: ([peer_id, ids]) => typingHandler(peer_id, ids, 'text')
  },

  64: {
    // Статус записи голосового сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    handler: ([peer_id, ids]) => typingHandler(peer_id, ids, 'audio')
  },

  65: {
    // Статус загрузки фото
    // [peer_id, [from_ids], ids_length, timestamp]
    handler: ([peer_id, ids]) => typingHandler(peer_id, ids, 'photo')
  },

  66: {
    // Статус загрузки видео
    // [peer_id, [from_ids], ids_length, timestamp]
    handler: ([peer_id, ids]) => typingHandler(peer_id, ids, 'video')
  },

  67: {
    // Статус загрузки файла
    // [peer_id, [from_ids], ids_length, timestamp]
    handler: ([peer_id, ids]) => typingHandler(peer_id, ids, 'file')
  },

  80: {
    // Изменение количества непрочитанных диалогов
    // [count, count_with_notifications, 0, 0]
    // count_with_notifications: кол-во непрочитанных диалогов, в которых включены уведомления
    handler([count]) {
      store.commit('updateMenuCounters', {
        name: 'messages',
        value: count
      });
    }
  },

  81: {
    // Изменение состояния невидимки друга
    // [-user_id, state, ts, -1, 0]
    // state: 1 - включена, 0 - выключена
  },

  90: {
    // Добавление или удаление из друзей
    // [2 | 3, user_id]
  },

  114: {
    // Изменение настроек пуш-уведомлений в беседе
    // [{ peer_id, sound, disabled_until }]
    // disabled_until: -1 - выключены; 0 - включены; * - время их включения
    handler([{ peer_id, disabled_until }]) {
      if (!store.state.messages.conversations[peer_id]) {
        return;
      }

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          muted: !!disabled_until
        }
      });

      addNotificationsTimer({ peer_id, disabled_until }, disabled_until <= 0);
    }
  },

  115: {
    // Звонок
  },

  119: {
    // Ответ callback-кнопки
    // [{ owner_id, peer_id, event_id, action? }]
    handler([data]) {
      const callback = activeKeyboardCallbackButtons[data.event_id];
      callback && callback(data);
    }
  }
};
