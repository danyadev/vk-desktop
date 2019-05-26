import { parseMessage, loadConversation, loadConversationMembers } from './messages';
import store from './store/';
import vkapi from './vkapi';

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
  // Если данные получены через messages.getLongPollHistory
  if(!Array.isArray(data)) return data;
  // Если это 2 событие прочтения сообщения
  if(!data[3]) return;

  const flag = hasFlag.bind(this, data[1]);
  const action = getServiceMessage(data[5]);

  return {
    peer: {
      id: data[2]
    },
    msg: {
      id: data[0],
      text: action ? '' : data[4],
      from: flag('outbox') ? store.getters['users/user'].id : Number(data[5].from || data[2]),
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

export default {
  2: {
    // 1) Удаление сообщения (128)
    // 2) Пометка как спам (64)
    // 3) Удаление для всех (131200)
    // [msg_id, flags, peer_id]
    parser: (data) => data,
    async handler([msg_id, flags, peer_id]) {
      if(!store.state.messages.peersList.includes(peer_id)) return;

      const msg = await getLastMessage(peer_id);

      if(!msg) {
        store.commit('messages/removeConversation', peer_id);
      }

      store.commit('messages/removeMessages', {
        peer_id: peer_id,
        msg_ids: [msg_id]
      });

      store.commit('messages/moveConversation', { peer_id });
    }
  },

  3: {
    // 1) Восстановление удаленного сообщения (128)
    // 2) Отмена пометки сообщения как спам (64)
    // 3) Прочитано сообщение (1) [msg_id, flags, peer_id], не юзается
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: (data) => getMessage(data),
    async handler({ peer, msg }) {
      const list = store.getters['messages/conversationsList'];
      const lastPeer = list[list.length-1];
      const inList = store.state.messages.peersList.includes(peer.id);

      if(inList || msg.date > lastPeer.msg.date) {
        if(!inList) {
          const conv = store.state.messages.conversations[peer.id];

          if(!conv) {
            store.commit('messages/addConversations', [{ peer, msg }]);
            loadConversation(peer.id);
          } else {
            store.commit('messages/addPeerToList', peer.id);
            await getLastMessage(peer.id);
          }
        } else {
          await getLastMessage(peer.id);
        }

        store.commit('messages/insertMessage', {
          peer_id: peer.id,
          msg: msg
        });

        store.commit('messages/moveConversation', {
          peer_id: peer.id,
          restoreMsg: true
        });
      }
    }
  },

  4: {
    // Новое сообщение
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: (data) => getMessage(data),
    handler({ peer, msg }) {
      // В случае, если данные были получены через messages.getLongPollHistory
      const isFullData = peer.unread != null;
      const conv = store.state.messages.conversations[peer.id];

      let peerData = {
        id: peer.id,
        unread: msg.out ? 0 : conv && conv.peer.unread + 1,
        last_msg_id: msg.id,
        ...(msg.out ? { in_read: msg.id } : { out_read: msg.id })
      };

      if(isFullData) {
        peerData = peer;
      } else if(msg.action && ['chat_create', 'chat_title_update'].includes(msg.action.type)) {
        peerData.title = msg.action.text;
      }

      store.commit('messages/addMessages', {
        peer_id: peer.id,
        messages: [msg],
        addNew: true
      });

      if(store.state.messages.peersList.indexOf(peer.id) == -1) {
        store.commit('messages/addConversations', [{
          peer: peerData,
          msg: msg
        }]);

        if(!isFullData) loadConversation(peer.id);
      } else {
        store.commit('messages/updateConversation', {
          peer: peerData,
          msg: msg
        });
      }

      store.commit('messages/moveConversation', {
        peer_id: peer.id,
        newMsg: true
      });
    }
  },

  5: {
    // Редактирование сообщения
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: (data) => getMessage(data),
    handler({ peer, msg }) {
      store.commit('messages/updateConversation', {
        peer: {
          id: peer.id
        },
        msg: msg
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
          out_read: msg_id
        }
      });
    }
  },

  8: {
    parser(data) {

    },
    handler(data) {

    }
  },

  9: {
    parser(data) {

    },
    handler(data) {

    }
  },

  10: {
    parser(data) {

    },
    handler(data) {

    }
  },

  12: {
    parser(data) {

    },
    handler(data) {

    }
  },

  13: {
    parser(data) {

    },
    handler(data) {

    }
  },

  18: {
    // Добавление сниппета к сообщению (при сообщении с ссылкой)
    // [msg_id, flags, peer_id, timestamp, text, {from, action}, {attachs}, random_id, conv_msg_id, edit_time]
    parser(data) {

    },
    handler(data) {

    }
  },

  51: {
    parser(data) {

    },
    handler(data) {

    }
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

      switch(type) {
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
    parser(data) {

    },
    handler(data) {

    }
  },

  64: {
    parser(data) {

    },
    handler(data) {

    }
  },

  80: {
    parser(data) {

    },
    handler(data) {

    }
  },

  114: {
    parser(data) {

    },
    handler(data) {

    }
  },

  115: {
    parser(data) {

    },
    handler(data) {

    }
  }
}
