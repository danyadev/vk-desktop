'use strict';

const util = require('util');
const querystring = require('querystring');
const EventEmitter = require('events').EventEmitter;

const request = require('./request');

let eventsList = require('./longpollEvents'),
    instance = null, onInitResolve = null;

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
          event = eventsList[id];

      if(!event) {
        console.error(`Longpoll: Неизвестное событие: ${id}`, data);
        continue;
      }

      let data = event.data(update, event.name);

      this.emit('new_event', id, data);
      this.emit(event.name, data);
    }

    this.loop();
  }
}

util.inherits(Longpoll, EventEmitter);

module.exports = {
  async init() {
    if(!instance) {
      let data = await Longpoll.getServer();

      instance = new Longpoll(data);
      if(onInitResolve) onInitResolve(instance);
    }

    return instance;
  },
  load() {
    return new Promise((resolve) => {
      if(!instance) onInitResolve = resolve;
      else resolve(instance);
    });
  }
};
