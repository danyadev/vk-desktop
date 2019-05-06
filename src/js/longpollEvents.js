function hasFlag(mask, name) {
  let sum = 0;
  const flags = [];
  const allFlags = {
    unread: 1, outbox: 2, replied: 4, important: 8,
    chat: 16, friends: 32, spam: 64, deleted: 128,
    fixed: 256, media: 512, hidden: 65536,
    deleted_for_all: 131072, reply_msg: 2097152
  };

  for(let flag in allFlags) {
    if(allFlags[flag] & mask) {
      flags.push(flag);
      sum += allFlags[flag];
    }
  }

  console.log('[lp] Unused flags mask:', mask - sum);

  return flags.includes(name);
}

export default {
  2: {
    parser(data) {
      // 1) Удаление сообщения (128)
      // 2) Пометка как спам (64)
      // 3) Удаление для всех (131200)
      // [msg_id, flags, peer_id]

      return {
        name: 'message_deleted',
        data: {
          all: hasFlag(data[1], 'deleted_for_all'),
          msg_id: data[0],
          peer_id: data[2]
        }
      }
    },
    handler(data) {
      
    }
  },

  3: {
    parser(data) {
      // 1) Восстановление удаленного сообщения (128)
      // 2) Отмена пометки сообщения как спам (64)
      // 3) Прочитано сообщение (1) [msg_id, flags, peer_id]
      // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]
    },
    handler(data) {

    }
  },

  4: {
    parser(data) {
      // 1) Новое сообщение
      // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]
    },
    handler(data) {

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
