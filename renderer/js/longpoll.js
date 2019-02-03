'use strict';

const querystring = require('querystring');
const { EventEmitter } = require('events');
const { parseConversation, parseMessage, concatProfiles } = require('./../components/messages/methods');

function getLastMsgId() {
  let peer = app.$store.getters.peers[0];

  if(peer) {
    let msg = app.$store.getters.lastMessage(peer.id);
    return msg && msg.id;
  }
}

class Longpoll extends EventEmitter {
  constructor() {
    super();

    this.loopStopped = true;
    this.started = false;
    this.debug = false;
    this.version = 6;
  }

  async start() {
    if(!this.server) {
      let data = await this.getServer();

      this.server = data.server;
      this.key = data.key;
      this.pts = data.pts;
      this.ts = data.ts;
    }

    this.started = true;
    this.emit('started');

    if(this.loopStopped) {
      this.loopStopped = false;
      this.loop();
    }
  }

  stop() {
    this.started = false;
    this.emit('stopped');
  }

  async getServer() {
    return await vkapi('messages.getLongPollServer', {
      lp_version: this.version,
      need_pts: 1
    });
  }

  async loop() {
    let { data } = await request(`https://${this.server}?` + querystring.stringify({
      act: 'a_check',
      key: this.key,
      ts: this.ts,
      wait: 10,
      mode: 490,
      version: this.version
    }));

    if(!this.started) return this.loopStopped = true;
    if(data.failed) await this.catchErrors(data);

    if(data.ts) this.ts = data.ts;
    if(data.pts) this.pts = data.pts;

    this.emitHistory(data.updates);
    this.loop();
  }

  emitHistory(history = []) {
    if(!history.length) return;

    let longpollEvents = require('./longpollEvents'),
        packs = { 2: {}, 3: {}, 4: {} },
        debugEvents = { packs: Object.assign({}, packs) };

    for(let item of history) {
      let id = item.splice(0, 1)[0],
          parseItem = longpollEvents[id];

      if(!parseItem) {
        console.warn('[longpoll] Неизвестное событие:', [id, ...update]);
        continue;
      }

      if(packs[id]) {
        let peer_id = item[2] || item[0].peer.id;

        if(packs[id][peer_id]) packs[id][peer_id].push(item);
        else packs[id][peer_id] = [item];
      } else {
        let { name, data } = parseItem(item) || {};

        if(name) {
          this.emit(name, data);

          if(this.debug) {
            if(debugEvents[name]) debugEvents[name].push(data);
            else debugEvents[name] = [data];
          }
        }
      }
    }

    for(let id in packs) {
      let parseItem = longpollEvents[id];

      for(let peer_id in packs[id]) {
        let { name, data } = parseItem(packs[id][peer_id]);

        if(this.debug) debugEvents.packs[id][peer_id] = data;

        this.emit(name, data);
      }
    }

    if(this.debug) console.log('[longpoll] Debug\n', debugEvents);
  }

  async catchErrors(data) {
    console.warn('[longpoll] Error:', data);

    switch(data.failed) {
      case 1:
        await this.getHistory();
        this.ts = data.ts;
        break;
      case 2:
        let { key } = await this.getServer();
        this.key = key;
        break;
      case 3:
        await this.getHistory();

        let server = await this.getServer();
        this.key = server.key;
        this.ts = server.ts;
        break;
    }
  }

  async getHistory() {
    let history = await vkapi('messages.getLongPollHistory', {
      ts: this.ts,
      pts: this.pts,
      events_limit: 1000,
      msgs_limit: 500,
      max_msg_id: getLastMsgId(),
      lp_version: this.version,
      fields: other.fields
    });

    this.pts = history.new_pts;

    app.$store.commit('addProfiles', concatProfiles(history.profiles, history.groups));

    let peers = history.conversations.reduce((peers, peer) => {
      peers[peer.peer.id] = parseConversation(peer);
      return peers;
    }, {});

    let messages = history.messages.items.reduce((msgs, msg) => {
      msgs[msg.id] = parseMessage(msg, peers[msg.peer_id]);
      return msgs;
    }, {});

    let events = [];

    for(let item of history.history) {
      if([3, 4, 5, 18].includes(item[0])) {
        events.push([item[0], {
          peer: peers[item[3]],
          msg: messages[item[1]]
        }]);
      } else events.push(item);
    }

    this.emitHistory(events);

    if(history.more) await this.getHistory();
  }
}

module.exports = new Longpoll();
