import { parseMessage, loadConversation, loadConversationMembers } from './messages';
import longpoll from 'js/longpoll';
import store from './store/';
import vkapi from './vkapi';
import { timer } from './utils';

function hasFlag(mask, name) {
  const flags = [];
  const allFlags = {
    // 524288 и 8192 - ?
    unread: 1, outbox: 2, replied: 4, important: 8,
    chat: 16, friends: 32, spam: 64, deleted: 128,
    fixed: 256, media: 512, hidden: 65536,
    deleted_for_all: 131072, reply_msg: 2097152
  };

  for(const flag in allFlags) {
    if(allFlags[flag] & mask) flags.push(flag);
  }

  return flags.includes(name);
}

function getServiceMessage(data) {
  const source = {};

  for(const item in data) {
    const match = item.match(/source_(.+)/);

    if(match) {
      let value = data[item],
          key = match[1];

      if(Number(value) == value) value = Number(value);
      if(key == 'act') key = 'type';

      source[key] = value;
    }
  }

  return Object.keys(source).length ? source : null;
}

function getAttachments(data) {
  const attachs = [];

  if(data.geo) attachs.push({ type: 'geo' });

  for(const key in data) {
    const match = key.match(/attach(\d+)$/);

    if(match) {
      const id = match[1];
      let type = data[`attach${id}_type`];

      if(data[`attach${id}_kind`] == 'audiomsg') type = 'audio_message';
      if(data[`attach${id}_kind`] == 'graffiti') type = 'graffiti';

      attachs.push({ type });
    }
  }

  return attachs;
}

function getMessage(data) {
  const user = store.getters['users/user'];

  // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
  // Если данные получены через messages.getLongPollHistory
  if(!Array.isArray(data)) return data;
  // Если это 2 событие прочтения сообщения или пометки его важным
  // Или юзер уже вышел из аккаунта
  if(!data[3] || !user) return;

  const flag = hasFlag.bind(this, data[1]);
  const action = getServiceMessage(data[5]);

  return {
    peer: {
      id: data[2]
    },
    msg: {
      id: data[0],
      text: action ? '' : data[4],
      from: flag('outbox') ? user.id : Number(data[5].from || data[2]),
      date: data[3],
      out: flag('outbox'),
      editTime: data[9],
      hidden: flag('hidden'),
      action: action,
      fwdCount: Number(data[5].fwd_count || 0),
      isReplyMsg: flag('reply_msg'),
      attachments: getAttachments(data[6]),
      conversation_msg_id: data[8],
      random_id: data[7]
    }
  };
}

async function getLastMessage(peer_id) {
  const {
    msg,
    unread,
    in_read,
    out_read,
    last_msg_id
  } = await vkapi('execute.getLastMessage', { peer_id });

  store.commit('messages/updateConversation', {
    peer: {
      id: peer_id,
      unread,
      in_read,
      out_read,
      last_msg_id
    },
    msg: msg && parseMessage(msg)
  });

  return msg;
}

async function watchTyping(peer_id, user_id) {
  await timer(1000);

  const user = store.state.messages.typing[peer_id][user_id];

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
    // 1) Пометка важным (8), не юзается
    // 2) Пометка как спам (64)
    // 3) Удаление сообщения (128)
    // 4) Удаление для всех (131200)
    // [msg_id, flags, peer_id]
    pack: true,
    parser(data) {
      if(!hasFlag(data[1], 'important')) return data[0];
    },
    async handler({ key: peer_id, items: msg_ids }) {
      const messages = store.state.messages.messages[peer_id] || [];
      if(!messages.length) return;

      store.commit('messages/removeMessages', { peer_id, msg_ids });

      const lastMsg = await getLastMessage(peer_id);

      if(!lastMsg) {
        store.commit('messages/updatePeersList', {
          id: peer_id,
          remove: true
        });
      } else {
        store.commit('messages/updateConversation', {
          peer: { id: peer_id },
          msg: lastMsg
        });

        store.commit('messages/moveConversation', { peer_id });
      }
    }
  },

  3: {
    // 1) Прочитано сообщение (1), не юзается
    // 2) Отмена пометки важным (8), не юзается
    // 3) Отмена пометки сообщения как спам (64)
    // 4) Восстановление удаленного сообщения (128)
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    // [msg_id, flags, peer_id] (1 или 2)
    pack: true,
    parser: getMessage,
    async handler({ key: peer_id, items }) {
      const conv = store.state.messages.conversations[peer_id];
      const { peersList } = store.state.messages;
      const convList = store.getters['messages/conversationsList'];
      const lastLocalMsg = conv && conv.msg;
      const lastAddedMsg = items[items.length-1];
      const lastLocalConv = convList[peersList.length - 1];

      const { items: newMessages } = await vkapi('messages.getById', {
        message_ids: items.map(({ msg }) => msg.id)
      });

      for(const msg of newMessages) {
        store.commit('messages/insertMessage', {
          peer_id: peer_id,
          msg: parseMessage(msg)
        });
      }

      const msg = await getLastMessage(peer_id);

      if(!lastLocalMsg || lastAddedMsg.msg.date > lastLocalMsg.date) {
        if(lastLocalConv && msg.date < lastLocalConv.msg.date) return;

        if(!conv) {
          store.commit('messages/addConversations', [lastAddedMsg]);
          loadConversation(peer_id);
        } else if(!peersList.includes(peer_id)) {
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
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    pack: true,
    parser: getMessage,
    handler({ key: peer_id, items }) {
      const conv = store.state.messages.conversations[peer_id];
      const lastMsg = items[items.length - 1].msg;

      const peerData = {
        id: peer_id,
        last_msg_id: lastMsg.id
      };

      store.commit('messages/addMessages', {
        peer_id: peer_id,
        messages: items.map(({ msg }) => msg),
        addNew: true
      });

      for(const { msg } of items) {
        longpoll.emit('new_message', msg.random_id);

        removeTyping(peer_id, msg.from);

        if(msg.out) {
          peerData.new_in_read = msg.id;
          peerData.in_read = msg.id;
          peerData.unread = 0;
        } else {
          peerData.out_read = msg.id;

          if(peerData.unread != null) peerData.unread++;
          else if(conv) peerData.unread = conv.peer.unread + 1;
        }
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
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: getMessage,
    handler({ peer, msg }) {
      const conv = store.state.messages.conversations[peer.id];
      const isLastMsg = conv && conv.msg.id == msg.id;

      removeTyping(peer.id, msg.from);

      store.commit('messages/updateConversation', {
        peer: { id: peer.id },
        ...(isLastMsg ? { msg: msg } : {})
      });

      store.commit('messages/editMessage', {
        peer_id: peer.id,
        msg: msg
      });
    }
  },

  6: {
    // Ты прочитал сообщения до msg_id
    // [peer_id, msg_id, count]
    parser: (data) => data,
    handler([peer_id, msg_id, count]) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          unread: count,
          in_read: msg_id
        }
      });
    }
  },

  7: {
    // Собеседник прочитал твои сообщения до msg_id
    // [peer_id, msg_id, count]
    parser: (data) => data,
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
    // Юзер появился в сети
    // [-user_id, platform, timestamp]
    // 1: любое приложение, 2: iphone, 3: ipad, 4: android, 5: wphone, 6: windows, 7: web
    parser: (data) => data,
    handler([id, platform, timestamp]) {
      if(!store.state.profiles[-id]) return;

      store.commit('updateProfile', {
        id: -id,
        online: true,
        online_mobile: ![6, 7].includes(platform),
        last_seen: {
          time: timestamp,
          platform: platform
        }
      });
    }
  },

  9: {
    // Юзер вышел из сети
    // [-user_id, flag, timestamp]
    // flag: 0 - вышел с сайта, 1 - по таймауту
    parser: (data) => data,
    handler([id, flag, timestamp]) {
      if(!store.state.profiles[-id]) return;

      store.commit('updateProfile', {
        id: -id,
        online: false,
        online_mobile: false,
        last_seen: {
          time: timestamp
        }
      });
    }
  },

  10: {
    // Включение уведомлений в чате (16)
    // [peer_id, flag]
    parser(data) {

    },
    handler(data) {

    }
  },

  11: {
    parser(data) {

    },
    handler(data) {

    }
  },

  12: {
    // Выключение уведомлений в чате
    // [peer_id, flag]
    parser(data) {

    },
    handler(data) {

    }
  },

  13: {
    // Удаление диалога
    // [peer_id, msg_id]
    parser: (data) => data,
    handler([peer_id, msg_id]) {
      store.commit('messages/removeConversationMessages', peer_id);
      store.commit('messages/updatePeersList', {
        id: peer_id,
        remove: true
      });
    }
  },

  18: {
    // Добавление сниппета к сообщению (если сообщение с ссылкой)
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: getMessage,
    handler({ peer: { id: peer_id }, msg }) {
      store.commit('messages/editMessage', { peer_id, msg });
    }
  },

  51: {
    // Изменение данных чата
    // [chat_id]
    // Событие не используется, так как событие 52 полностью его заменяет
    parser() {},
    handler() {}
  },

  52: {
    // Изменение данных чата
    // https://vk.com/dev/using_longpoll_2?f=3.2.+Дополнительные+поля+чатов
    // [type, peer_id, info]
    parser: (data) => data,
    handler([type, peer_id, info]) {
      const isMe = info == store.getters['users/user'].id;
      const conv = store.state.messages.conversations[peer_id];
      const peer = conv && conv.peer;
      if(!peer) return;

      if([7, 8].includes(type)) removeTyping(peer_id, info, isMe);

      switch(type) {
        case 1: // Изменилось название беседы
        case 2: // Изменилась аватарка беседы
          loadConversation(peer_id);
          break;
        case 3: // Назначен новый администратор
          // TODO
          break;
        case 5: // Закреплено сообщение
          // TODO
          break;
        case 6: // Пользователь присоединился к беседе
          if(peer.members != null) peer.members++;

          if(isMe) {
            peer.left = false;
            peer.canWrite = true;

            loadConversation(peer_id);
            loadConversationMembers(peer.id, true);
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
        case 9: // С пользователя сняты права администратора
          // TODO
          break;
      }

      store.commit('messages/updateConversation', { peer });
    }
  },

  63: {
    // Написание сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    parser: (data) => data,
    handler([peer_id, ids]) {
      for(const id of ids) {
        if(id == store.getters['users/user'].id) continue;

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
    // Запись голосового сообщения
    // [peer_id, [from_ids], ids_length, timestamp]
    parser: (data) => data,
    handler([peer_id, ids]) {
      for(const id of ids) {
        if(id == store.getters['users/user'].id) continue;

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
    // [count, count_with_notifications, 0]
    // count_with_notifications - кол-во непрочитанных диалогов, в которых включены уведомления
    parser: ([count]) => count,
    handler(count) {
      store.commit('updateMenuCounters', {
        name: 'messages',
        value: count
      });
    }
  },

  114: {
    // Изменеие настроек пуш-уведомлений в беседе
    // [{ peer_id, sound, disabled_until }]
    // disabled_until: -1 - выключены; 0 - включены; * - время их включения
    // При значении > 0 нужно самому следить за временем, ибо событие при включении не приходит.
    parser: (data) => data,
    handler([{ peer_id, disabled_until }]) {
      if(!store.state.messages.conversations[peer_id]) return;

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          muted: disabled_until != 0
        }
      });
    }
  },

  115: {
    // Звонок
    parser(data) {

    },
    handler(data) {

    }
  }
}
