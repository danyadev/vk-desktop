'use strict';

function getFlags(mask) {
  let flags = {
    unread: 1, outbox: 2, replied: 4, important: 8,
    chat: 16, friends: 32, spam: 64, deleted: 128,
    fixed: 256, media: 512, hidden: 65536, deleted_all: 131072,
    reply_msg: 2097152
  }, flagsInMask = [];

  for(let flag in flags) if(flags[flag] & mask) flagsInMask.push(flag);

  return {
    is: (name) => flagsInMask.includes(name),
    list: flagsInMask
  }
}

function getServiceMessage(data) {
  if(!data) return null;
  let source = {};

  Object.keys(data).forEach((key) => {
    let match = key.match(/source_(.+)/);

    if(match) {
      let value = data[key];

      if(Number(value) == value) value = Number(value);
      if(match[1] == 'act') match[1] = 'type';

      source[match[1]] = value;
    }
  });

  return Object.keys(source).length ? source : null;
}

function getAttachments(data) {
  let attachs = [];

  Object.keys(data).forEach((key) => {
    let match = key.match(/attach(\d+)$/);

    if(match) {
      let id = match[1],
          attach = { type: data[`attach${id}_type`] };

      if(data[`attach${id}_kind`] == 'audiomsg') attach.type = 'audio_message';
      if(data[`attach${id}_kind`] == 'graffiti') attach.type = 'graffiti';

      attachs.push(attach);
    }
  });

  if(data.geo) attachs.push({ type: 'geo' });

  return attachs;
}

function chatIsChannel(id) {
  let conversation = app.$store.state.conversations[id];
  if(id < 2e9 || !conversation) return false;
  return conversation.peer.channel;
}

function getMessage(data, type) {
  // Если сообщение было получено с помощью longpoll.getHistory
  if(other.isObject(data)) return data;

  let flags = getFlags(data[1]),
      action = getServiceMessage(data[5]),
      from_id = flags.is('outbox') ? app.user.id : Number(data[5].from || data[2]),
      isChannel = chatIsChannel(from_id);

  let res = {
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
      editTime: data[9],
      unread: !flags.is('outbox') && flags.is('unread'),
      action: action,
      fwdCount: Number(data[5].fwd_count || 0),
      isReplyMsg: flags.is('reply_msg'),
      attachments: getAttachments(data[6]),
      hidden: flags.is('hidden'),
      conversationMsgId: data[8],
      random_id: data[7]
    }
  }

  if(type == 'new') res.msg.outread = flags.is('outbox');

  return res;
}

module.exports = {
  2: (events) => {
    // 1) Удаление сообщения (128)
    // 2) Пометка как спам (64)
    // 3) Удаление для всех (131200)
    // [msg_id, flags, peer_id]

    let messages = [];

    for(let data of events) {
      let flags = getFlags(data[1]);

      messages.push({
        id: data[0],
        all: flags.is('deleted_all')
      });
    }

    return {
      name: 'delete_messages',
      data: {
        peer_id: events[0][2],
        messages
      }
    }
  },
  3: (events) => {
    // 1) Восстановление удаленного сообщения (128)
    // 2) Отмена пометки сообщения как спам (64)
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]

    let messages = [];

    for(let data of events) {
      let flags = getFlags(data[1]);

      if(flags.is('spam') || flags.is('deleted')) {
        messages.push(getMessage(data));
      } else if(!flags.is('unread')) {
        console.warn('Неизвестные данные в 3 событии:', data, flags);
      }
    }

    return {
      name: 'restore_messages',
      data: {
        peer_id: events[0][2],
        messages
      }
    }
  },
  4: (events) => {
    // 1) Новое сообщение
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]

    let messages = [];

    for(let data of events) {
      let msg = getMessage(data, 'new');
      messages.push(msg);
      longpoll.emit(`new_message_${msg.msg.random_id}`, msg);
    }

    return {
      name: 'new_messages',
      data: {
        peer_id: events[0][2],
        messages
      }
    }
  },
  5: (data) => {
    // 1) Редактирование сообщения
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]

    return {
      name: 'edit_message',
      data: getMessage(data)
    }
  },
  6: (data) => {
    // 1) Ты прочитал сообщения до msg_id
    // [peer_id, msg_id, count]

    return {
      name: 'read_messages',
      data: {
        peer_id: data[0],
        msg_id: data[1],
        count: data[2]
      }
    }
  },
  7: (data) => {
    // 1) Кто-то прочитал сообщение до msg_id
    // [peer_id, msg_id, count]

    return {
      name: 'readed_messages',
      data: {
        peer_id: data[0],
        msg_id: data[1],
        count: data[2]
      }
    }
  },
  8: (data) => {
    // 1) Кто-то стал онлайн
    // [-user_id, platform, timestamp]
    // 1: mobile, 2: iphone, 3: ipad, 4: android, 5: wphone, 6: windows, 7: web

    let device;

    if(![1, 7].includes(data[1])) {
      let names = {
        2: 'iPhone',
        3: 'iPad',
        4: 'Android',
        5: 'Windows Phone',
        6: 'Windows 10 App'
      }

      device = names[data[1]];
    }

    return {
      name: 'online_user',
      data: {
        type: 'online',
        id: Math.abs(data[0]),
        mobile: ![6, 7].includes(data[1]),
        device: device,
        timestamp: data[2]
      }
    }
  },
  9: (data) => {
    // 1) Кто-то стал оффлайн
    // [-user_id, flag, timestamp]
    // flag: 0 - вышел с сайта, 1 - по таймауту

    return {
      name: 'online_user',
      data: {
        type: 'offline',
        id: Math.abs(data[0]),
        timestamp: data[2]
      }
    }
  },
  10: (data) => {
    // TODO: диалоги сообществ

    return { name: 'remove_peer_flags', data }
  },
  11: (data) => {
    // TODO: диалоги сообществ

    return { name: 'change_peer_flags', data }
  },
  12: (data) => {
    // TODO: диалоги сообществ

    return { name: 'set_peer_flags', data }
  },
  13: (data) => {
    // приходит при удалении диалога (все сообщения до id)
    // [peer_id, id]

    return {
      name: 'delete_peer',
      data: {
        peer_id: data[0],
        msg_id: data[1]
      }
    }
  },
  18: (data) => {
    // приходит при добавлении сниппета к сообщению
    // (например когда написал ссылку)
    // [msg_id, flags, peer_id, timestamp, text, {from, actions}, {attachs}, conv_msg_id, edit_time]

    return {
      name: 'add_message_snippet',
      data: getMessage(data)
    }
  },
  51: () => {}, // абсолютно не нужное событие
  52: (data) => {
    // приходит при изменении данных чата (см разд. 3.2 доки)
    // [type_id, peer_id, info]

    return { name: 'change_peer_info', data }
  },
  61: (data) => {
    // приходит когда юзер пишет вам в лс
    // [user_id, 1]

    return {
      name: 'typing',
      data: {
        type: 'text',
        peer_id: data[0],
        from_id: data[0]
      }
    }
  },
  63: (data) => {
    // приходит когда кто-то пишет сообщение
    // [peer_id, [from_id], 1, timestamp]

    return {
      name: 'typing',
      data: {
        type: 'text',
        peer_id: data[0],
        from_id: data[1][0]
      }
    }
  },
  64: (data) => {
    // приходит когда кто-то записывает голосовое сообщение
    // [peer_id, [from_id], 1, timestamp]

    return {
      name: 'typing',
      data: {
        type: 'audio',
        peer_id: data[0],
        from_id: data[1][0]
      }
    }
  },
  80: (data) => {
    // приходит при изменении кол-ва сообщений
    // [count, count_with_notifications, 0]
    // count_with_notifications - кол-во непрочитанных диалогов, в которых включены уведомления

    return {
      name: 'update_messages_counter',
      data: data[0]
    }
  },
  114: ([data]) => {
     // приходит при изменении настроек пуш уведомлений у диалога
     // [{ peer_id, sound, disabled_until }]
     // disabled_until: -1 - выключены; 0 - включены; иначе - timestamp когда их включить

    return {
      name: 'change_push_settings',
      data: {
        peer_id: data.peer_id,
        state: data.disabled_until == 0,
        timestamp: data.disabled_until > 0 ? data.disabled_until : null
      }
    }
  },
  115: ({ data }) => {
    // разные данные для активного звонка
    return { name: 'user_call_data', data }
  }
}
