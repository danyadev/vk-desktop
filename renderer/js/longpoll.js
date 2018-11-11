'use strict';

const util = require('util');
const querystring = require('querystring');
const EventEmitter = require('events').EventEmitter;

const request = require('./request');

let eventsList = {
  1: 'change_flags',
  2: 'set_flags',
  3: 'remove_flags',
  4: 'new_message',
  5: 'edit_message',
  6: 'read_in_messages', // прочитал чужое сообщение
  7: 'read_out_messages', // кто-то прочитал твое сообщение
  8: 'online_user',
  9: 'offline_user',
  10: 'remove_peer_flags',
  11: 'change_peer_flags',
  12: 'set_peer_flags',
  13: 'delete_peer',
  14: 'restore_peer', // эмм, непонятно зачем он если это сделать невозможно
  51: 'говно',
  52: 'change_peer_info',
  61: 'user_typing',
  62: 'peer_typing',
  70: 'user_call', //
  80: 'change_counter', // [messages_count, 0]
  114: 'change_push_settings', // [{ peer_id, sound: 0|1, disabled_until: 0|-1|timestamp }],
  115: 'user_call_data' // приходят данные на различных этапах звонка (мы совершили звонок)
};

let instance = null, onInitCallback = null;

class Longpoll {
  constructor(data) {
    this.server = data.server;
    this.key = data.key;
    this.pts = data.pts;
    this.ts = data.ts;

    this.loop();
  }

  static async getServer() {
    return await vkapi('messages.getLongPollServer', { lp_version: 3, need_pts: 1 });
  }

  async loop() {
    let [ host, path ] = this.server.split('/'),
        data = await request({
          host,
          path: `/${path}?` + querystring.stringify({
            act: 'a_check',
            key: this.key,
            ts: this.ts,
            wait: 15,
            mode: 106,
            version: 3
          })
        }, { force: true });

    if(data.failed) {
      if([1, 3].includes(data.failed)) {
        let history = await vkapi('messages.getLongPollHistory', {
              ts: this.ts,
              pts: this.pts,
              onlines: 1,
              lp_version: 3,
              fields: 'photo_50,verified,sex,first_name_acc,last_name_acc'
            });

        if(data.failed == 3) {
          let server = await Longpoll.getServer();

          this.key = server.key;
          this.ts = server.ts;
        }

        this.ts = data.ts || this.ts;
        this.pts = history.new_pts;

        // TODO: обрабатывать history
      } else if(data.failed == 2) {
        let server = await Longpoll.getServer();

        this.key = server.key;
        this.pts = server.pts;
      }
    }

    this.ts = data.ts || this.ts;
    this.pts = data.pts || this.pts;

    for(let update of data.updates || []) {
      let id = update.splice(0, 1)[0],
          data = updateToData(update);

      if(!eventsList[id]) {
        console.error(`Longpoll: Неизвестное событие: ${id}`, data);
        continue;
      }

      this.emit('new_event', id, data);
      this.emit(eventsList[id], data);
    }

    this.loop();
  }
}

util.inherits(Longpoll, EventEmitter);

// используемые функции

let updateToData = (update) => {
  // TODO: перевести в нормальный обьект
  return update;
}

let historyToData = (history) => {

}

module.exports = {
  async init () {
    if(!instance) {
      let data = await Longpoll.getServer();

      instance = new Longpoll(data);
      if(onInitCallback) onInitCallback(instance);
    }

    return instance;
  },
  load(callback) {
    if(!instance) onInitCallback = callback;
    else callback(instance);
  }
};
