import { parseMessage, loadConversation, loadConversationMembers } from './messages';
import longpoll from 'js/longpoll';
import store from './store/';
import vkapi from './vkapi';
import { timer } from './utils';

function hasFlag(mask, flag) {
  const flags = {
    unread:       1 << 0,  // Приходит всегда
    outbox:       1 << 1,  // Сообщение от тебя
    important:    1 << 3,  // Важное сообщение
    chat:         1 << 4,  // Отправка сообщения в беседу через (m.)vk.com
    friends:      1 << 5,  // Отправлено тобой либо другом в лс
    spam:         1 << 6,  // Пометка сообщения как спам
    deleted:      1 << 7,  // Удаление сообщения
    chat2:        1 << 13, // Отправка в беседу через клиенты
    cancel_spam:  1 << 15, // Отмена пометки как спам
    hidden:       1 << 16, // Приветственное сообщение от группы
    deleted_all:  1 << 17, // Удаление сообщения для всех
    chat_in:      1 << 19, // Входящее сообщение в беседе
    fuckin_flag:  1 << 20, // Приветственное сообщение, выход из беседы
    reply_msg:    1 << 21  // Ответ на сообщение
  };

  let newMask = mask;
  const msgFlags = [];

  for(const name in flags) {
    const flag = flags[name];

    if(flag & mask) {
      newMask -= flag;
      msgFlags.push(name);
    }
  }

  const newFlags = newMask.toString(2).split('').reverse().reduce((arr, item, index) => {
    if(item == 1) arr.push(1 << index);

    return arr;
  }, []);

  if(longpoll.debug || newFlags.length) {
    console.log(mask, msgFlags, newFlags);
  }

  const checkFlag = (flag) => flags[flag] & mask;

  return flag ? checkFlag(flag) : checkFlag;
}

function getServiceMessage(data) {
  const source = {};

  for(const item in data) {
    const match = item.match(/source_(.+)/);

    if(match) {
      let key = match[1];

      if(key == 'act') key = 'type';

      source[key] = data[item];
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
      const kind = data[`attach${id}_kind`];
      let type = data[`attach${id}_type`];

      if(kind == 'audiomsg') type = 'audio_message';
      if(kind == 'graffiti') type = 'graffiti';

      attachs.push({ type });
    }
  }

  return attachs;
}

function getMessage(data) {
  // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
  const user = store.getters['users/user'];
  const flag = hasFlag(data[1]);

  // Если данные получены через messages.getLongPollHistory
  if(!Array.isArray(data)) return data;
  // Если это 2 событие прочтения сообщения или пометки его важным
  // Или юзер уже вышел из аккаунта
  if(!data[3] || !user) return;

  const action = getServiceMessage(data[5]);
  const from_id = flag('outbox') ? user.id : Number(data[5].from || data[2]);
  const { keyboard } = data[5];

  return {
    peer: {
      id: data[2],
      keyboard: keyboard && Object.assign(keyboard, { author_id: from_id })
    },
    msg: {
      id: data[0],
      text: action ? '' : data[4],
      from: from_id,
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
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    // [msg_id, flags, peer_id] (1 или 2)
    pack: true,
    parser: getMessage,
    async handler({ key: peer_id, items }) {
      const conv = store.state.messages.conversations[peer_id];
      const convList = store.getters['messages/conversationsList'];
      const messagesList = store.state.messages.messages[peer_id] || [];
      const lastLocalConv = convList[convList.length - 1];
      const [firstLocalMsg] = messagesList;
      const newMsgPeer = items[0].peer;

      items = items.sort((a, b) => a.id - b.id);

      if(!firstLocalMsg || items[0].msg.id < firstLocalMsg.id) {
        const { items: [prevMsg] } = await vkapi('messages.getHistory', {
          peer_id: peer_id,
          offset: messagesList.length,
          count: 1
        });

        if(prevMsg) {
          let id = prevMsg.conversation_msg_id;

          for(const { msg } of items) {
            if(msg.conversation_msg_id-1 == id) id = msg.conversation_msg_id;
          }

          items = items.filter(({ msg }) => msg.conversation_msg_id >= id);
          items.push({ peer: newMsgPeer, msg: prevMsg });
        }
      }

      const { items: newMessages } = await vkapi('messages.getById', {
        message_ids: items.map(({ msg }) => msg.id).join(',')
      });

      for(const msg of newMessages) {
        store.commit('messages/insertMessage', {
          peer_id: peer_id,
          msg: parseMessage(msg)
        });
      }

      const msg = await getLastMessage(peer_id);

      if(!lastLocalConv || lastLocalConv.msg.id < msg.id) {
        if(!conv) {
          store.commit('messages/addConversations', [items[items.length - 1]]);
          loadConversation(peer_id);
        } else if(!store.state.messages.peersList.includes(peer_id)) {
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

      for(const { msg, peer: { keyboard } } of items) {
        longpoll.emit('new_message', msg, peer_id);

        removeTyping(peer_id, msg.from);

        if(msg.action && msg.action.type == 'chat_title_update') {
          peerData.title = msg.action.text;
        }

        if(msg.out) {
          peerData.new_in_read = msg.id;
          peerData.in_read = msg.id;
          peerData.unread = 0;
        } else {
          peerData.out_read = msg.id;

          if(keyboard) peerData.keyboard = keyboard;

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
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
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
    // platform: 1: любое приложение, 2: iphone, 3: ipad, 4: android, 5: wphone, 6: windows, 7: web
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

  12: {
    // Выключение уведомлений в чате (16)
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
    // [msg_id, flags, peer_id, timestamp, text, {from, action, keyboard}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: getMessage,
    handler({ peer: { id: peer_id }, msg }) {
      store.commit('messages/editMessage', { peer_id, msg });
    }
  },

  51: {
    // Изменение данных чата
    // [chat_id]
    // Событие не используется, так как событие 52 полностью его заменяет
    parser() {}
  },

  52: {
    // Изменение данных чата
    // [type, peer_id, info]
    // https://vk.com/dev/using_longpoll_2?f=3.2.+Дополнительные+поля+чатов
    parser: (data) => data,
    handler([type, peer_id, info]) {
      const isMe = info == store.getters['users/user'].id;
      const conv = store.state.messages.conversations[peer_id];
      const peer = conv && conv.peer;

      if(!peer) return;
      if([7, 8].includes(type)) removeTyping(peer_id, info, isMe);

      switch(type) {
        case 2: // Изменилась аватарка беседы
          loadConversation(peer_id);

          break;
        case 6: // Пользователь присоединился к беседе
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
    // [count, count_with_notifications, 0, 0]
    // count_with_notifications: кол-во непрочитанных диалогов, в которых включены уведомления
    parser: ([count]) => count,
    handler(count) {
      store.commit('updateMenuCounters', {
        name: 'messages',
        value: count
      });
    }
  },

  81: {
    // Изменение состояния невидимки
    // [-user_id, state, ts, -1, 0]
    // state: 1 - включена, 0 - выключена
    parser(data) {

    },
    handler(data) {

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
          muted: !!disabled_until
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
