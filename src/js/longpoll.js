import { EventEmitter } from 'events';
import querystring from 'querystring';
import request from './request';
import vkapi from './vkapi';
import { concatProfiles, fields } from './utils';
import { parseConversation, parseMessage } from './messages';
import store from './store/';
import longpollEvents from './longpollEvents';

function getLastMsgId() {
  const [peer] = store.getters['messages/conversationsList'];

  return peer && peer.msg.id;
}

export default new class Longpoll extends EventEmitter {
  constructor() {
    super();

    this.debug = false;
    this.started = false;
    this.version = 8;
  }

  async getServer() {
    return await vkapi('messages.getLongPollServer', {
      lp_version: this.version,
      need_pts: 1
    });
  }

  async start(data) {
    if(!data) data = await this.getServer();

    this.server = data.server;
    this.key = data.key;
    this.pts = data.pts;
    this.ts = data.ts;

    this.started = true;
    this.loop();
  }

  stop() {
    this.started = false;
  }

  async loop() {
    while(this.started) {
      const { data } = await request(`https://${this.server}?` + querystring.stringify({
        act: 'a_check',
        key: this.key,
        ts: this.ts,
        wait: 10,
        mode: 490,
        version: this.version
      }));

      if(this.started) {
        if(data.failed) await this.catchErrors(data);
        if(data.ts) this.ts = data.ts;
        if(data.pts) this.pts = data.pts;

        this.emitHistory(data.updates);
      }
    }
  }

  async catchErrors(data) {
    console.warn('[longpoll] Error:', data);

    switch(data.failed) {
      case 1:
        await this.getHistory();
        this.ts = data.ts;
        break;
      case 2:
        const { key } = await this.getServer();
        this.key = key;
        break;
      case 3:
        await this.getHistory();

        const server = await this.getServer();
        this.key = server.key;
        this.ts = server.ts;
        break;
    }
  }

  async getHistory() {
    const history = await vkapi('messages.getLongPollHistory', {
      ts: this.ts,
      pts: this.pts,
      msgs_limit: 500,
      max_msg_id: getLastMsgId(),
      lp_version: this.version,
      fields: fields
    });

    store.commit('addProfiles', concatProfiles(history.profiles, history.groups));
    this.pts = history.new_pts;

    const peers = history.conversations.reduce((peers, peer) => {
      peers[peer.peer.id] = parseConversation(peer);
      return peers;
    }, {});

    const messages = history.messages.items.reduce((msgs, msg) => {
      msgs[msg.id] = parseMessage(msg, peers[msg.peer_id]);
      return msgs;
    }, {});

    const events = [];

    for(const item of history.history) {
      if([3, 4, 5, 18].includes(item[0])) {
        if(item[0] == 3 && !item[4]) continue;

        events.push([item[0], {
          peer: peers[item[3]],
          msg: messages[item[1]]
        }, 'fake', item[3]]);
      } else events.push(item);
    }

    this.emitHistory(events);

    if(history.more) await this.getHistory();
  }

  emitHistory(history = []) {
    if(!history.length) return;

    const events = [];

    for(const item of history) {
      if(this.debug && ![8, 9].includes(item[0])) console.log('[lp]', item.slice());

      const [id] = item.splice(0, 1);
      const event = longpollEvents[id];

      if(!event) {
        console.warn('[longpoll] Неизвестное событие', [id, ...item]);
      } else {
        const data = event.parser(item[1] == 'fake' ? item[0] : item);
        if(!data) continue;

        if(event.pack) {
          const prev = events[events.length - 1];

          if(prev && prev[2] == item[2]) prev[1].push(data);
          else events.push([id, [data], item[2]]);
        } else {
          events.push([id, data]);
        }
      }
    }

    for(const item of events) {
      const { handler } = longpollEvents[item[0]];

      if(item[2]) {
        handler({ key: Number(item[2]), items: item[1] });
      } else {
        handler(item[1]);
      }
    }
  }
}
