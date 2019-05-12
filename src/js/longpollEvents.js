import store from './store/';

function hasFlag(mask, name) {
  const flags = [];
  const allFlags = {
    unread: 1, outbox: 2, replied: 4, important: 8,
    chat: 16, friends: 32, spam: 64, deleted: 128,
    fixed: 256, media: 512, hidden: 65536,
    deleted_for_all: 131072, reply_msg: 2097152
  };

  for(let flag in allFlags) {
    if(allFlags[flag] & mask) flags.push(flag);
  }

  return flags.includes(name);
}

function getServiceMessage(data) {
  const source = {};

  Object.keys(data).forEach((item) => {
    const match = item.match(/source_(.+)/);

    if(match) {
      let value = data[key],
          key = match[1];

      if(Number(value) == value) value = Number(value);
      if(key == 'act') key = 'type';

      source[key] = value;
    }
  });

  return Object.keys(source).length ? source : null;
}

function getAttachments(data) {
  const attachs = [
    ...(data.geo ? [{ type: 'geo' }] : [])
  ];

  Object.keys(data).forEach((key) => {
    const match = key.match(/attach(\d+)$/);

    if(match) {
      const id = match[1];
      const attach = { type: data[`attach${id}_type`] };

      if(data[`attach${id}_kind`] == 'audiomsg') attach.type = 'audio_message';
      if(data[`attach${id}_kind`] == 'graffiti') attach.type = 'graffiti';

      attachs.push(attach);
    }
  });

  return attachs;
}

function getMessage(data, isNewMsg) {
  const flag = hasFlag.bind(this, data[1]);
  const action = getServiceMessage(data[5]);
  const from_id = flag('outbox') ? store.getters['users/user'].id : Number(data[5].from || data[2]);
  const isChannel = isNewMsg && !data[1];

  return {
    peer: {
      id: data[2],
      type: data[2] > 2e9 ? 'chat' : 'user',
      channel: isChannel,
      owner: isChannel ? from_id : data[2]
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

export default {
  2: {
    // 1) Удаление сообщения (128)
    // 2) Пометка как спам (64)
    // 3) Удаление для всех (131200)
    // [msg_id, flags, peer_id]
    parser: (data) => ({
      all: hasFlag(data[1], 'deleted_for_all'),
      msg_id: data[0],
      peer_id: data[2]
    }),
    handler(data) {

    }
  },

  3: {
    // 1) Восстановление удаленного сообщения (128)
    // 2) Отмена пометки сообщения как спам (64)
    // 3) Прочитано сообщение (1) [msg_id, flags, peer_id], не юзается
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: (data) => !hasFlag(data[1], 'unread') && getMessage(data),
    handler(data) {

    }
  },

  4: {
    // 1) Новое сообщение
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, random_id, conv_msg_id, edit_time]
    parser: (data) => getMessage(data, true),
    handler({ peer, msg }) {
      const conv = store.state.messages.conversations[peer.id];

      store.commit('messages/addMessages', {
        peer_id: peer.id,
        messages: [msg],
        addNew: true
      });

      store.commit('messages/updateConversation', {
        peer: {
          id: peer.id,
          unread: msg.out ? 0 : conv && conv.peer.unread + 1,
          last_msg_id: msg.id,
          ...(msg.out ? { in_read: msg.id } : { out_read: msg.id })
        },
        msg: msg
      });
    }
  },

  5: {
    parser(data) {

    },
    handler(data) {

    }
  },

  6: {
    parser(data) {

    },
    handler(data) {

    }
  },

  7: {
    parser(data) {

    },
    handler(data) {

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
    parser(data) {

    },
    handler(data) {

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
