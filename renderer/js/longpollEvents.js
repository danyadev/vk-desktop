module.exports = {
  2: {
    name: 'set_flags',
    data: (data) => {
      // когда приходит?
      // [msg_id, flag, peer_id]
      return data;
    }
  },
  3: {
    name: 'remove_flags',
    data: (data) => {
      // когда приходит?
      // [msg_id, flag, peer_id, timestramp, "text", {from, fwd, actions}, {attachs}]
      return data;
    }
  },
  4: {
    name: 'new_message',
    data: (data) => {
      // приходит при написании нового сообщения
      // [msg_id, flags, peer_id, timestramp, "text", {from, fwd, actions}, {attachs}]
      return data;
    }
  },
  5: {
    name: 'edit_message',
    data: (data) => {
      // приходит при редактировании сообщения
      // [msg_id, flags, peer_id, timestramp, "text", {from, fwd, actions}, {attachs}]
      return data;
    }
  },
  6: {
    name: 'read_in_messages', // прочитал чужое сообщение
    data: (data) => {
      // приходит при прочтении чужих сообщений до msg_id
      // [peer_id, msg_id, 0]
      return data;
    }
  },
  7: {
    name: 'read_out_messages', // кто-то прочитал твое сообщение
    data: (data) => {
      // приходит при прочтении твоих сообщений до msg_id
      // [peer_id, msg_id, 0]
      return data;
    }
  },
  8: {
    name: 'online_user',
    data: (data) => {
      // приходит когда юзер становится онлайн
      // [-user_id, platform, timestramp]
      // 1: mobile, 2: iphone, 3: ipad, 4: android, 5: wphone, 6: windows, 7: web
      return data;
    }
  },
  9: {
    name: 'offline_user',
    data: (data) => {
      // приходит когда пользователь становится онлайн
      // [-user_id, flag, timestramp]
      // flag: 0 - вышел с сайта, 1 - по таймауту
      return data;
    }
  },
  10: {
    name: 'remove_peer_flags',
    data: (data) => {
      // TODO: диалоги сообществ
      return data;
    }
  },
  11: {
    name: 'change_peer_flags',
    data: (data) => {
      // TODO: диалоги сообществ
      return data;
    }
  },
  12: {
    name: 'set_peer_flags',
    data: (data) => {
      // TODO: диалоги сообществ
      return data;
    }
  },
  13: {
    name: 'delete_peer',
    data: (data) => {
      // приходит при удалении диалога (все сообщения до msg_id)
      // [peer_id, msg_id]
      return data;
    }
  },
  51: {
    name: null, // нужная информация передается в 52 эвенте
    data: (data) => data
  },
  52: {
    name: 'change_peer_info',
    data: (data) => {
      // приходит при изменении данных чата (см разд. 3.2 доки)
      // [type_id, peer_id, info]
      return data;
    }
  },
  61: {
    name: 'user_typing',
    data: (data) => {
      // приходит когда юзер пишет вам в лс
      // [user_id, 1]
      return data;
    }
  },
  62: {
    name: 'peer_typing',
    data: (data) => {
      // приходит когда кто-то пишет в беседе
      // [user_id, chat_id]
      return data;
    }
  },
  64: {
    name: 'audio_message_typing',
    data: (data) => {
      // приходит когда кто-то записывает голосовое сообщение
      // [peer_id, [from_id], 1, timestramp]
      return data;
    }
  },
  80: {
    name: 'change_counter',
    data: (data) => {
      // приходит при увеличении кол-ва сообщений
      // [count, 0]
      return data;
    }
  },
  114: {
    name: 'change_push_settings',
    data: (data) => {
      // приходит при изменении настроек пуш уведомлений у диалога
       // [{ peer_id, sound, disabled_until }]
       // sound: работет некорректно, юзайте disabled_until
       // disabled_until: -1 - выключены; 0 - включены; иначе - timestramp когда их включить
      return data;
    }
  },
  115: {
    name: 'user_call_data',
    data: (data) => {
      // разные данные для активного звонка
      return data;
    }
  }
}
