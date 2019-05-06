import { EventEmitter } from 'events';
import querystring from 'querystring';
import request from './request';
import vkapi from './vkapi';
import { concatProfiles, fields } from './utils';
import { parseMessge, parseConversation } from './messages';
import store from './store/';
import longpollEvents from './longpollEvents';

function getLastMsgId() {
  const peer = store.getters['messages/conversationsList'][0];

  return peer && peer.msg.id;
}

export default new class Longpoll extends EventEmitter {
  constructor() {
    super();

    this.started = false;
    this.stopped = true;
    this.version = 6;
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

    this.stopped = false;
    this.started = true;

    this.emit('start');
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

      if(data.failed) await this.catchErrors(data);
      if(data.ts) this.ts = data.ts;
      if(data.pts) this.pts = data.pts;

      this.emitHistory(data.updates);
    }

    this.stopped = true;
    this.emit('stop');
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
    this.emitHistory(history.history);

    if(history.more) await this.getHistory();
  }

  emitHistory(history = []) {
    if(!history.length) return;

    for(let item of history) {
      const [ id ] = item.splice(0, 1);
      const event = longpollEvents[id];

      if(!event) console.warn('[longpoll] Неизвестное событие', [id, ...item]);
      else event.handler(event.parser(item));
    }
  }
}
