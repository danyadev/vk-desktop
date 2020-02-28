import {
  parseMessage,
  parseConversation,
  loadConversation,
  loadConversationMembers,
  addNotificationsTimer
} from './messages';
import { supportedAttachments, preloadAttachments } from '../components/messages/chat/attachments/attachments';
import longpoll from 'js/longpoll';
import store from './store/';
import vkapi from './vkapi';
import { timer, eventBus, isObject } from './utils';

function hasFlag(mask, flag) {
  const checkFlag = (flag) => flags[flag] & mask;
  const flags = {
    unread:         1,       // Непрочитанное сообщение
    outbox:         1 << 1,  // Исходящее сообщение
    important:      1 << 3,  // Важное сообщение
    chat:           1 << 4,  // Отправка сообщения в беседу через vk.com
    friends:        1 << 5,  // Исходящее; входящее от друга в лс
    spam:           1 << 6,  // Пометка сообщения как спам
    deleted:        1 << 7,  // Удаление сообщения локально
    audio_listened: 1 << 12, // Прослушано голосовое сообщение
    chat2:          1 << 13, // Отправка в беседу через клиенты
    cancel_spam:    1 << 15, // Отмена пометки как спам
    hidden:         1 << 16, // Приветственное сообщение от группы
    deleted_all:    1 << 17, // Удаление сообщения для всех
    chat_in:        1 << 19, // Входящее сообщение в беседе
    noname_flag:    1 << 20, // Неизвестный флаг
    reply_msg:      1 << 21  // Ответ на сообщение
  };

  return flag ? checkFlag(flag) : checkFlag;
}

function getServiceMessage(data) {
  const source = {};

  for(const item in data) {
    const match = item.match(/source_(.+)/);

    if(match) {
      const key = match[1] == 'act' ? 'type' : match[1];
      source[key] = data[item];
    }
  }

  return Object.keys(source).length && source;
}

function getAttachments(data) {
  const attachments = {};

  if(data.geo) attachments.geo = [null];

  for(const key in data) {
    const match = key.match(/attach(\d+)$/);

    if(match) {
      const id = match[1];
      const kind = data[`attach${id}_kind`];
      let type = data[`attach${id}_type`];

      if(kind == 'audiomsg') type = 'audio_message';
      if(kind == 'graffiti') type = 'graffiti';
      if(type == 'group') type = 'event';

      if(!attachments[type]) attachments[type] = [null];
      else attachments[type].push(null);
    }
  }

  return attachments;
}

function parseLongPollMessage(data) {
  // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
  const user = store.getters['users/user'];
  // Если данные получены через messages.getLongPollHistory
  if(isObject(data)) return data;
  // Если это 2 событие прочтения сообщения или пометки его важным
  // Или юзер уже вышел из аккаунта
  if(!data[3] || !user) return;

  const flag = hasFlag(data[1]);
  const action = getServiceMessage(data[5]);
  const from_id = flag('outbox') ? user.id : Number(data[5].from || data[2]);
  const { keyboard } = data[5];
  const attachments = getAttachments(data[6]);
  const isReplyMsg = flag('reply_msg');
  const hasAttachment = isReplyMsg || data[6].fwd || Object.keys(attachments).length;

  if(keyboard) keyboard.author_id = from_id;

  return {
    peer: {
      id: data[2],
      keyboard: keyboard && !keyboard.inline && keyboard,
      channel: from_id < 0 && data[2] > 2e9 && data[5].title === '',
      mentions: data[5].mentions || []
    },
    msg: {
      id: data[0],
      text: action ? '' : data[4],
      from: from_id,
      date: data[3],
      out: from_id == user.id || flag('outbox'),
      editTime: data[9],
      hidden: flag('hidden'),
      action: action,
      fwdCount: Number(data[5].fwd_count || (!isReplyMsg && data[6].fwd ? -1 : 0)),
      fwdMessages: [],
      isReplyMsg: isReplyMsg,
      attachments: attachments,
      conversation_msg_id: data[8],
      random_id: data[7],
      was_listened: false,
      hasAttachment: hasAttachment,
      isContentDeleted: !data[4] && !action && !hasAttachment,
      keyboard: keyboard && keyboard.inline && keyboard,
      // Нужно только для пометки сообщения как обязательное для переполучения через апи
      hasTemplate: data[5].has_template,
      fromLongPoll: true
    }
  };
}

async function getLastMessage(peer_id) {
  const { message, conversation } = await vkapi('execute.getLastMessage', {
    peer_id,
    func_v: 2
  });

  const msg = message && parseMessage(message);
  const peer = parseConversation(conversation);

  store.commit('messages/updateConversation', { msg, peer });

  return { msg, peer };
}

async function loadMessages(peer_id, msg_ids, onlyReturnMessages) {
  const { items } = await vkapi('messages.getById', {
    message_ids: msg_ids.join(',')
  });

  const messages = [];

  for(const msg of items) {
    const parsedMsg = parseMessage(msg);

    if(onlyReturnMessages) {
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

function hasSupportedAttachments(msg) {
  if(msg.isReplyMsg || msg.fwdCount || msg.hasTemplate) return true;

  for(const attach in msg.attachments) {
    if(supportedAttachments.has(attach)) return true;
  }
}

function hasPreloadMessages(messages) {
  for(const { msg } of messages) {
    if(msg.fwdCount || msg.hasTemplate) return true;

    for(const attach in msg.attachments) {
      if(preloadAttachments.has(attach)) return true;
    }
  }
}

async function watchTyping(peer_id, user_id) {
  await timer(1000);

  const typingPeer = store.state.messages.typing[peer_id];
  const user = typingPeer && typingPeer[user_id];

  if(user && user.time) {
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

  if(typing[user_id] || clearChat) {
    store.commit('messages/removeUserTyping', {
      peer_id: peer_id,
      user_id: !clearChat && user_id
    });
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
      if(flag('audio_listened')) {
        return store.commit('messages/editMessage', {
          peer_id: data[2],
          msg: {
            id: data[0],
            was_listened: true
          }
        });
      }

      if(!flag('important')) return data[0];
    },
    async handler({ key: peer_id, items: msg_ids }) {
      store.commit('messages/removeMessages', { peer_id, msg_ids });

      const { msg } = await getLastMessage(peer_id);

      if(msg) {
        store.commit('messages/moveConversation', { peer_id });
        eventBus.emit('messages:event', 'checkScrolling', { peer_id });
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
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    // [msg_id, flags, peer_id] (пункты 1 и 2)
    pack: true,
    parser: parseLongPollMessage,
    preload: hasPreloadMessages,
    async handler({ key: peer_id, items }) {
      const conv = store.state.messages.conversations[peer_id];
      const convList = store.getters['messages/conversationsList'];
      const lastLocalConv = convList[convList.length - 1];
      const messagesList = store.state.messages.messages[peer_id] || [];
      const [topMsg] = messagesList;
      const bottomMsg = messagesList[messagesList.length - 1];
      const { msg, peer } = await getLastMessage(peer_id);
      let unlockUp, unlockDown;

      items = items.filter((item) => {
        if(!topMsg) unlockUp = unlockDown = true;
        else if(item.msg.id < topMsg.id) unlockUp = true;
        else if(item.msg.id > bottomMsg.id) unlockDown = true;
        else return 1;
      });

      if(items.length) {
        const { items: newMessages } = await vkapi('messages.getById', {
          message_ids: items.map(({ msg }) => msg.id).join(',')
        });

        for(const msg of newMessages) {
          store.commit('messages/insertMessage', {
            peer_id: peer_id,
            msg: parseMessage(msg)
          });
        }
      }

      eventBus.emit('messages:event', 'checkScrolling', {
        peer_id,
        unlockUp,
        unlockDown
      });

      if(!lastLocalConv || lastLocalConv.msg.id < msg.id) {
        if(conv && !store.state.messages.peersList.includes(peer_id)) {
          store.commit('messages/updatePeersList', { id: peer_id });
        }

        store.commit('messages/moveConversation', {
          peer_id: peer_id,
          restoreMsg: true
        });
      }
    }
  },

  4: {
    // Новое сообщение
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    pack: true,
    parser: parseLongPollMessage,
    preload: hasPreloadMessages,
    async handler({ key: peer_id, items }, isPreload) {
      const { opened, loading } = store.state.messages.peersConfig[peer_id] || {};
      const conv = store.state.messages.conversations[peer_id];
      const localMessages = store.state.messages.messages[peer_id] || [];
      const lastLocalMsg = localMessages[localMessages.length-1];
      let lastMsg = items[items.length - 1].msg;
      const messagesWithAttachments = [];
      const peerData = {
        id: peer_id,
        last_msg_id: lastMsg.id,
        mentions: conv && conv.peer.mentions || []
      };

      const isChatLoadedBottom = opened && (
        !lastLocalMsg && !loading ||
        lastLocalMsg && conv.peer.last_msg_id == lastLocalMsg.id
      );

      if(isChatLoadedBottom) {
        store.commit('messages/addMessages', {
          peer_id,
          messages: items
            .filter((msg) => !hasPreloadMessages([msg]))
            .map(({ msg }) => msg),
          addNew: true
        });
      }

      for(const { msg, peer: { keyboard, mentions } } of items) {
        if(hasSupportedAttachments(msg) && isChatLoadedBottom) {
          messagesWithAttachments.push(msg.id);
        }

        if(msg.action && msg.action.type == 'chat_title_update') {
          peerData.title = msg.action.text;
        }

        if(msg.out) {
          peerData.in_read = msg.id;
          peerData.unread = 0;
        } else {
          removeTyping(peer_id, msg.from);

          peerData.out_read = msg.id;

          if(keyboard) peerData.keyboard = keyboard;

          if(peerData.unread != null) {
            peerData.unread++;
          } else if(conv) {
            peerData.unread = (conv.peer.unread || 0) + 1;
          }

          if(mentions.includes(store.state.users.activeUser)) {
            peerData.mentions.push(msg.id);
          }
        }
      }

      if(messagesWithAttachments.length) {
        if(isPreload) {
          const messages = await loadMessages(peer_id, messagesWithAttachments, true);

          store.commit('messages/addMessages', {
            peer_id,
            messages,
            addNew: true
          });

          lastMsg = messages[messages.length-1];
        } else {
          loadMessages(peer_id, messagesWithAttachments);
        }
      }

      for(let i = 0; i < items.length; i++) {
        eventBus.emit('messages:event', 'new', {
          peer_id,
          random_id: items[i].msg.random_id,
          isFirstMsg: !i
        });
      }

      if(lastMsg.hidden) return;

      if(!store.state.messages.peersList.includes(peer_id)) {
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
        peer_id: peer_id,
        newMsg: true
      });
    }
  },

  5: {
    // Редактирование сообщения
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: parseLongPollMessage,
    preload: (data) => hasPreloadMessages([data]),
    async handler({ peer, msg }, isPreload) {
      const conv = store.state.messages.conversations[peer.id];
      const messages = store.state.messages.messages[peer.id] || [];
      const isLastMsg = conv && conv.msg.id == msg.id;
      const activeId = store.state.users.activeUser;

      removeTyping(peer.id, msg.from);

      if(hasSupportedAttachments(msg) && messages.find((message) => message.id == msg.id)) {
        if(isPreload) {
          [msg] = await loadMessages(peer.id, [msg.id], true);
        } else {
          loadMessages(peer.id, [msg.id]);
        }
      }

      const updateConvData = {
        peer: {
          id: peer.id,
          mentions: conv && conv.peer.mentions || []
        }
      };

      if(isLastMsg) updateConvData.msg = msg;

      if(
        msg.id > (conv && conv.peer.in_read) && // Непрочитанное сообщение
        updateConvData.peer.mentions.includes(msg.id) && // В старом сообщении есть упоминание
        !peer.mentions.includes(activeId) // В новом сообщении нет упоминания
      ) {
        updateConvData.peer.mentions.splice(updateConvData.peer.mentions.indexOf(msg.id), 1);
      }

      store.commit('messages/updateConversation', updateConvData);
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
      const conv = store.state.messages.conversations[peer_id];
      const mentions = conv && conv.peer.mentions || [];
      const newMentions = mentions.slice();
      const isMyDialog = peer_id == store.state.users.activeUser;

      for(const id of mentions) {
        if(msg_id >= id) {
          newMentions.splice(newMentions.indexOf(id), 1);
        }
      }

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          unread: count,
          in_read: msg_id,
          ...(isMyDialog ? { out_read: msg_id } : {}),
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
      if(!store.state.profiles[-id]) return;

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
    handler([id, isTimeout, time, app_id]) {
      if(!store.state.profiles[-id]) return;

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
    // Упоминание в беседе peer_id просмотрено
    // [peer_id, flag]
  },

  12: {
    // Появилось упоминание (пуш или ответ на сообщение) в беседе peer_id
    // [peer_id, flag]
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
    }
  },

  18: {
    // Добавление сниппета к сообщению (если сообщение с ссылкой)
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: parseLongPollMessage,
    preload: (data) => hasPreloadMessages([data]),
    async handler({ peer, msg }, isPreload) {
      if(isPreload) {
        [msg] = await loadMessages(peer.id, [msg.id], true);
      }

      store.commit('messages/editMessage', { peer_id: peer.id, msg });
    }
  },

  19: {
    // Сброс кеша сообщения
    // [msg_id]
    // Необходимо переполучить сообщение через апи
    handler(msg_id) {
      const conversations = store.state.messages.messages;

      for(const peer_id in conversations) {
        const messages = conversations[peer_id];

        for(const { id } of messages) {
          if(id == msg_id) {
            return loadMessages(peer_id, [id]);
          }
        }
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
    handler([type, peer_id, extra]) {
      const isMe = extra == store.state.users.activeUser;
      const conv = store.state.messages.conversations[peer_id];
      const peer = conv && conv.peer;

      if(!peer) return;
      if([7, 8].includes(type)) removeTyping(peer_id, extra, isMe);

      switch(type) {
        case 1: // Изменилось название беседы (обрабатывается в 4 событии)
          break;

        case 2: // Изменилась аватарка беседы
          loadConversation(peer_id);
          break;

        case 3: // Назначен новый администратор
          break;

        case 4: // Изменение прав в беседе; extra = маска прав:
          /*
            1  - Приглашать участников в беседу могут только администраторы
            2  - Неизвестно
            4  - Менять закрепленное сообщение могут только администраторы
            8  - Редактировать информацию беседы (фото, имя) могут только администраторы
            16 - Добавлять администраторов кроме создателя могут и другие администраторы
          */
          break;

        case 5: // Закрепление или открепление сообщения
          if(extra) loadConversation(peer_id);
          else peer.pinnedMsg = null;
          break;

        case 6: // Пользователь присоединился к беседе (по ссылке, приглашение или возвращение в беседу)
          if(peer.members != null) peer.members++;

          if(isMe) {
            peer.left = false;
            peer.canWrite = !peer.channel;

            if(!peer.channel) {
              loadConversation(peer_id);
              loadConversationMembers(peer.id, true);
            }
          }
          break;

        case 7: // Пользователь покинул беседу
          if(peer.members != null) peer.members--;
          if(isMe) peer.left = true;
          break;

        case 8: // Пользователя исключили из беседы
          if(peer.members != null) peer.members--;

          if(isMe) {
            peer.left = true;
            peer.canWrite = false;
          }
          break;

        case 9: // Разжалован администратор
          break;

        case 11: // Открытие/закрытие клавиатуры
          break;

        default:
          console.warn('[lp] Неизвестное действие в 52 событии:', ...arguments);
          break;
      }

      store.commit('messages/updateConversation', { peer });
    }
  },

  63: {
    // Статус набора сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    handler([peer_id, ids]) {
      for(const id of ids) {
        if(id == store.state.users.activeUser) continue;

        store.commit('messages/addUserTyping', {
          peer_id: peer_id,
          user_id: id,
          type: 'text'
        });

        watchTyping(peer_id, id);
      }
    }
  },

  64: {
    // Статус записи голосового сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    handler([peer_id, ids]) {
      for(const id of ids) {
        if(id == store.state.users.activeUser) continue;

        store.commit('messages/addUserTyping', {
          peer_id: peer_id,
          user_id: id,
          type: 'audio'
        });

        watchTyping(peer_id, id);
      }
    }
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

  114: {
    // Изменеие настроек пуш-уведомлений в беседе
    // [{ peer_id, sound, disabled_until }]
    // disabled_until: -1 - выключены; 0 - включены; * - время их включения
    handler([{ peer_id, disabled_until }]) {
      if(!store.state.messages.conversations[peer_id]) return;

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
  }
}
