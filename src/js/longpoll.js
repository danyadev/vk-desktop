import electron from 'electron';
import { concatProfiles, fields, toUrlParams } from './utils';
import { parseConversation, parseMessage } from './messages';
import vkapi from './vkapi';
import store from './store';
import request from './request';
import longpollEvents from './longpollEvents';
import { copyArray } from './copyObject';
import debug from './debug';

const { isPackaged } = electron.remote.app;
const IGNORED_DEBUG_EVENTS = [6, 8, 9, 63, 64, 65, 66, 67, 80];
const EVENTS_WITH_MESSAGE = [3, 4, 5, 18];

class Longpoll {
  constructor() {
    this.version = 10;
    this.debug = false;
  }

  getServer() {
    return vkapi('messages.getLongPollServer', {
      lp_version: this.version,
      need_pts: 1
    });
  }

  saveServer(data) {
    this.server = data.server;
    this.key = data.key;
    this.ts = data.ts;
    this.pts = data.pts;
  }

  start(data) {
    this.saveServer(data);
    this.loop();
  }

  async loop() {
    while (true) {
      const { data } = await request(`https://${this.server}?` + toUrlParams({
        act: 'a_check',
        key: this.key,
        ts: this.ts,
        wait: 10,
        mode: 2 | 8 | 32 | 64 | 128,
        version: this.version
      }), { timeout: 15000 });

      if (data.failed) await this.catchErrors(data);
      if (data.ts) this.ts = data.ts;
      if (data.pts) this.pts = data.pts;

      await this.emitHistory(data.updates);
    }
  }

  async catchErrors(data) {
    console.warn('[lp] Error:', data);

    switch (data.failed) {
      case 1:
        await this.getHistory(true);
        break;

      case 2:
        const { key } = await this.getServer();
        this.key = key;
        break;

      case 3:
        await this.getHistory(true);
        break;

      case 4:
        throw new Error('[lp] Invalid LongPoll version');
    }
  }

  async getHistory(credentials) {
    const history = await vkapi('messages.getLongPollHistory', {
      credentials: credentials ? 1 : 0,
      pts: this.pts,
      msgs_limit: 500,
      lp_version: this.version,
      fields
    });

    if (history.credentials) {
      this.saveServer(history.credentials);
    }

    store.commit('addProfiles', concatProfiles(history.profiles, history.groups));
    this.pts = history.new_pts;

    const peers = history.conversations.reduce((conversations, conversation) => {
      conversations[conversation.peer.id] = parseConversation(conversation);
      return conversations;
    }, {});

    const messages = history.messages.items.reduce((messages, message) => {
      messages[message.id] = parseMessage(message);
      return messages;
    }, {});

    const events = [];

    for (const item of history.history) {
      const msg = messages[item[1]];

      if (EVENTS_WITH_MESSAGE.includes(item[0])) {
        // 18 событие не содержит peer_id (т.е. там есть только ID сообщения)
        const peer_id = item[3] || msg.peer_id;

        events.push([
          item[0], // id события
          { peer: peers[peer_id], msg },
          'fromHistory',
          item[3] // peer_id
        ]);
      } else if (item[0] !== 19 || !(msg && msg.isExpired)) {
        events.push(item);
      }
    }

    this.emitHistory(events);

    if (history.more) {
      return this.getHistory(credentials);
    }
  }

  async emitHistory(history = []) {
    if (!history.length) {
      return;
    }

    const filteredHistory = copyArray(history).filter((item) => {
      if (isPackaged && EVENTS_WITH_MESSAGE.includes(item[0]) && item.length > 4) {
        item[5] = ''; // текст сообщения
      }

      return !IGNORED_DEBUG_EVENTS.includes(item[0]);
    });

    if (filteredHistory.length) {
      debug('[longpoll] ' + JSON.stringify(filteredHistory));
    }

    const events = [];

    for (const rawEvent of history) {
      const shouldLogEvent = Array.isArray(this.debug)
        ? this.debug.includes(rawEvent[0])
        : this.debug && !IGNORED_DEBUG_EVENTS.includes(rawEvent[0]);
      if (shouldLogEvent) {
        console.log('[lp]', rawEvent.slice());
      }

      const [id] = rawEvent.splice(0, 1);
      const event = longpollEvents[id];

      if (!event) {
        console.warn('[lp] Неизвестное событие', [id, ...rawEvent]);
        continue;
      }

      if (!event.handler) {
        continue;
      }

      const fromHistory = rawEvent[1] === 'fromHistory';
      const rawData = fromHistory ? rawEvent[0] : rawEvent;
      const data = event.parser && !fromHistory
        ? event.parser(rawData)
        : rawData;

      if (!data) {
        continue;
      }

      if (event.pack) {
        const prevEvent = events[events.length - 1];

        if (
          prevEvent &&
          prevEvent[0] === id && // совпадают id событий
          prevEvent[2] === rawEvent[2] // и peer_id
        ) {
          prevEvent[1].push(data);
        } else {
          events.push([id, [data], rawEvent[2], fromHistory]);
        }
      } else {
        events.push([id, data, null, fromHistory]);
      }
    }

    for (const [id, data, peer_id, fromHistory] of events) {
      const { handler, preload } = longpollEvents[id];
      const isPreload = !!(!fromHistory && preload && preload(data));
      const promise = peer_id
        ? handler({ peer_id: +peer_id, items: data }, isPreload)
        : handler(data, isPreload);

      if (isPreload) {
        await promise;
      }
    }
  }
}

export default new Longpoll();
