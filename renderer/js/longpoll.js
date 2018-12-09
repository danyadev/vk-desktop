'use strict';

const util = require('util');
const querystring = require('querystring');
const { EventEmitter } = require('events');

const request = require('./request');
const { parseConversation, parseMessage, concatProfiles } = require('./../components/messages/methods');

let instance, onInitResolve;

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

    if(!data.updates) data.updates = [];

    if(data.failed) {
      console.warn('[longpoll] Error:', data);

      if([1, 3].includes(data.failed)) {
        let history = await vkapi('messages.getLongPollHistory', {
          ts: this.ts,
          pts: this.pts,
          onlines: 1,
          lp_version: 3,
          fields: 'photo_50,verified,sex,first_name_acc,last_name_acc,online,last_seen'
        });

        await concatProfiles(history.profiles, history.groups).forEach((profile) => {
          app.$store.commit('addProfiles', profile);
        });

        for(let item of history.history) {
          if([4, 5].includes(item[0])) {
            let type = item[0] == 4 ? 'new_message' : 'edit_message',
                conversation = history.conversations.find((conv) => conv.peer.id == item[3]),
                message = history.messages.items.find((msg) => msg.id == item[1]);

            this.emit(type, {
              peer: parseConversation(conversation),
              msg: parseMessage(message, conversation)
            })
          } else data.updates.push(item);
        }

        if(data.failed == 3) {
          let server = await Longpoll.getServer();

          this.key = server.key;
          this.ts = server.ts;
        }

        this.ts = data.ts || this.ts;
        this.pts = history.new_pts;
      } else if(data.failed == 2) {
        let server = await Longpoll.getServer();

        this.key = server.key;
        this.pts = server.pts;
      }
    }

    this.ts = data.ts || this.ts;
    this.pts = data.pts || this.pts;

    for(let update of data.updates || []) {
      let upd = update.slice(0),
          id = upd.splice(0, 1)[0],
          eventsList = require('./longpollEvents'),
          event = eventsList[id];

      if(!event) {
        console.error('[longpoll] Неизвестное событие:', id, update);
        continue;
      }

      let eventData = event(upd);

      // Событие не нужно обрабатывать, ибо по моему
      // мнению оно не несет никакого смысла
      if(!eventData.name) continue;

      this.emit(eventData.name, eventData.data);
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
  },
  longpoll: () => instance
};
