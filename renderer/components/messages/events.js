'use strict';

const { parseConversation, parseMessage, loadConversation, loadAttachments } = require('./methods');

function moveConversations(peerID, isDelete) {
  app.$store.commit('movePeer', peerID);

  if(isDelete) {
    let peerIndex = app.$store.getters.peers.findIndex(({ id }) => id == peerID),
        lastPeerIndex = app.$store.getters.peers.length - 1;

    if(peerIndex == lastPeerIndex) app.$store.commit('removePeer', peerID);
  }
}

function updateLastMsg(peer_id, msg) {
  app.$store.commit('updateLastMsg', { peer_id, msg });
}

async function updatePeer(peerID, data, optional) {
  if(!app.$store.getters.peers.length) return;
  data.id = peerID;

  let dialog = app.$store.state.conversations[peerID],
      peer = dialog && dialog.peer;

  if(!peer && !optional) {
    app.$store.commit('addConversation', { peer: data });

    let conversation = await loadConversation(peerID);
    updatePeer(peerID, conversation);
  } else app.$store.commit('editPeer', data);
}

function checkTyping(peer_id, from_id) {
  let chatTyping = app.$store.state.typing[peer_id];

  if(chatTyping && chatTyping[from_id]) {
    app.$store.commit('removeTyping', { peer_id, from_id });
  }
}

async function removeTyping({ type, peer_id, from_id }) {
  let user = app.$store.state.typing[peer_id][from_id];
  if(!user) return;

  if(user.time) {
    app.$store.commit('setTyping', {
      peer_id,
      from_id,
      data: { type, time: user.time - 1 }
    });

    await utils.timer(1000);
    return removeTyping({ type, peer_id, from_id });
  }

  app.$store.commit('removeTyping', { peer_id, from_id });
}

async function updateChat(peer_id) {
  let { items: [peer] } = await vkapi('messages.getConversationsById', {
    peer_ids: peer_id
  });

  updatePeer(peer_id, parseConversation(peer), true);
}

longpoll.on('typing', ({ type, peer_id, from_id }) => {
  app.$store.commit('setTyping', {
    peer_id,
    from_id,
    data: { type, time: 6 }
  });

  removeTyping({ type, peer_id, from_id });
});

longpoll.on('new_message', ({ msg, peer }) => {
  app.$store.commit('addMessage', { peer_id: peer.id, msg });

  if(msg.hidden) return;

  updateLastMsg(peer.id, msg);
  loadAttachments(msg, peer.id);

  app.$store.commit('incrementUnreadCount', {
    peer_id: peer.id,
    state: !msg.outread
  });

  if(msg.action) {
    if(['chat_create', 'chat_title_update'].includes(msg.action.type)) {
      peer.title = msg.action.text;
    }

    if(msg.action.type == 'chat_kick_user') {
      if(msg.action.mid == app.user.id) peer.photo = null;
    }
  }

  updatePeer(peer.id, peer);
  checkTyping(peer.id, msg.from);
  moveConversations(peer.id);
});

longpoll.on('edit_message', ({ peer, msg }) => {
  updatePeer(peer.id, peer, true);
  loadAttachments(msg, peer.id);
  checkTyping(peer.id, msg.from);

  app.$store.commit('editMessage', { peer_id: peer.id, msg });
});

longpoll.on('update_messages_counter', (count) => {
  app.$store.commit('settings/updateCounter', { type: 'messages', count });
});

longpoll.on('add_message_snippet', ({ peer, msg }) => {
  updatePeer(peer.id, peer, true);
  loadAttachments(msg, peer.id);
  app.$store.commit('editMessage', { peer_id: peer.id, msg });
});

longpoll.on('delete_message', async ({ peer_id, msg_id, all }) => {
  app.$store.commit('removeMessage', { peer_id, msg_id });

  let { msg, unread, out_read, in_read } = await vkapi('execute.getLastMessage', { peer_id }),
      messages = app.$store.state.messages[peer_id],
      lastMsg = msg && parseMessage(msg, { out_read, in_read });

  if(!messages || !messages.length) {
    if(!msg) {
      app.$store.commit('removePeer', peer_id);
      return;
    }

    app.$store.commit('addMessage', { peer_id, msg: lastMsg });
  }

  updateLastMsg(peer_id, lastMsg);
  updatePeer(peer_id, { unread }, true);
  moveConversations(peer_id, true);
});

longpoll.on('restore_message', async ({ peer, msg }) => {
  let { out_read } = await vkapi('execute.getLastMessage', { peer_id: peer.id });
  msg.outread = out_read < msg.id;

  let messages = app.$store.state.messages[peer.id] || [],
      ids = messages.map((msg) => msg.id),
      index = utils.getNewIndex(ids, msg.id);

  if(index == 0) {
    let prevMsgId = await vkapi('execute.getPrevMsg', {
      peer_id: peer.id,
      offset: messages.length - 1
    });

    if(prevMsgId != msg.id) return;
  }

  app.$store.commit('addMessage', { peer_id: peer.id, msg });
  loadAttachments(msg, peer.id);

  if(messages[messages.length - 1].id == msg.id) {
    updateLastMsg(peer.id, msg);
    moveConversations(peer.id);
  }
});

longpoll.on('readed_messages', (data) => {
  let messages = app.$store.state.messages[data.peer_id] || [],
      msgs = messages.filter(({ id, outread }) => (id <= data.msg_id && outread));

  for(let msg of msgs) {
    app.$store.commit('editMessage', {
      peer_id: data.peer_id,
      msg: {
        id: msg.id,
        outread: false
      }
    });
  }

  app.$store.commit('editPeer', {
    id: data.peer_id,
    in_read: data.msg_id
  });
});

longpoll.on('read_messages', (data) => {
  let messages = app.$store.state.messages[data.peer_id] || [],
      msgs = messages.filter(({ id, unread }) => (id <= data.msg_id && unread));

  for(let msg of msgs) {
    app.$store.commit('editMessage', {
      peer_id: data.peer_id,
      msg: {
        id: msg.id,
        unread: false
      }
    });
  }

  updatePeer(data.peer_id, { unread: data.count }, true);
});

longpoll.on('change_push_settings', (data) => {
  updatePeer(data.peer_id, { muted: !data.state }, true);
});

longpoll.on('online_user', (data) => {
  app.$store.commit('updateProfile', {
    id: data.id,
    online: data.type == 'online',
    online_mobile: data.mobile,
    online_device: data.device,
    last_seen: { time: data.timestamp }
  });
});

longpoll.on('delete_peer', (data) => {
  app.$store.commit('removePeer', data.peer_id);

  let messages = app.$store.state.messages[data.peer_id] || [],
      msgs = messages.filter(({ id }) => id <= data.msg_id);

  for(let msg of msgs) {
    app.$store.commit('removeMessage', {
      peer_id: data.peer_id,
      msg_id: msg.id
    });
  }
});

longpoll.on('change_peer_info', ([type, peer_id, data]) => {
  let { peer } = app.$store.state.conversations[peer_id] || {};
  if(!peer) return;

  switch(type) {
    case 1: // Изменилось название беседы
      // Ха-ха, ищи это в событии нового сообщения
      break;
    case 2: // Изменилась аватарка беседы
      updateChat(peer_id);
      break;
    case 3: // Назначен новый администратор
      // TODO
      break;
    case 5: // Закреплено сообщение
      // TODO
      break;
    case 6: // Пользователь присоединился к беседе
      if(peer.members != null) peer.members++;
      if(data == app.user.id) updateChat(peer_id);

      break;
    case 7: // Пользователь покинул беседу
      if(peer.members != null) peer.members--;
      if(data == app.user.id) peer.left = true;

      break;
    case 8: // Пользователя исключили из беседы
      if(peer.members != null) peer.members--;
      if(data == app.user.id) peer.canWrite = { allowed: false, reason: 917 };

      break;
    case 9: // С пользователя сняты права администратора
      // TODO
      break;
  }
});
