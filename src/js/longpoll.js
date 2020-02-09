import querystring from 'querystring';
import request from './request';
import vkapi from './vkapi';
import { concatProfiles, fields } from './utils';
import { parseConversation, parseMessage, getLastMsgId } from './messages';
import store from './store/';
import longpollEvents from './longpollEvents';

export default new class Longpoll {
  constructor() {
    this.debug = false;
    this.version = 10;
  }

  getServer() {
    return vkapi('messages.getLongPollServer', {
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

    this.loop();
  }

  async loop() {
    while(true) {
      const { data } = await request(`https://${this.server}?` + querystring.stringify({
        act: 'a_check',
        key: this.key,
        ts: this.ts,
        wait: 10,
        mode: 2 | 8 | 32 | 64 | 128,
        version: this.version
      }), { timeout: 11000 });

      if(data.failed) await this.catchErrors(data);
      if(data.ts) this.ts = data.ts;
      if(data.pts) this.pts = data.pts;

      await this.emitHistory(data.updates);
    }
  }

  async catchErrors(data) {
    console.warn('[lp] Error:', data);

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
      msgs[msg.id] = parseMessage(msg);
      return msgs;
    }, {});

    const events = [];

    for(const item of history.history) {
      if([3, 4, 5, 18].includes(item[0])) {
        events.push([
          item[0], // id события
          { peer: peers[item[3]], msg: messages[item[1]] },
          'fromHistory',
          item[3] // peer_id
        ]);
      } else {
        events.push(item);
      }
    }

    this.emitHistory(events);

    if(history.more) await this.getHistory();
  }

  async emitHistory(history = []) {
    if(!history.length) return;

    const events = [];

    for(const item of history) {
      if(this.debug && ![8, 9, 63, 64].includes(item[0])) {
        console.log('[lp]', item.slice());
      }

      const [id] = item.splice(0, 1);
      const event = longpollEvents[id];

      if(!event) {
        console.warn('[lp] Неизвестное событие', [id, ...item]);
        continue;
      }
      if(!event.handler) continue;

      const fromHistory = item[1] == 'fromHistory';
      const rawData = fromHistory ? item[0] : item;
      const data = event.parser ? event.parser(rawData) : rawData;
      if(!data) continue;

      if(event.pack) {
        const prev = events[events.length - 1];

        if(
          prev && prev[0] == id && // совпадают id событий
          prev[2] == item[2] // и peer_id
        ) {
          prev[1].push(data);
        } else {
          events.push([id, [data], item[2], fromHistory]);
        }
      } else {
        events.push([id, data, null, fromHistory]);
      }
    }

    for(const [id, data, peer_id, fromHistory] of events) {
      const { handler, preload } = longpollEvents[id];
      const isPreload = !fromHistory && preload && preload(data);
      const promise = peer_id
        ? handler({ key: +peer_id, items: data }, isPreload)
        : handler(data, isPreload);

      if(isPreload) await promise;
    }
  }
}
