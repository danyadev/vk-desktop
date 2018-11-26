'use strict';

module.exports = {
  concatProfiles(users = [], groups = []) {
    groups = groups.reduce((list, group) => {
      group.id = -group.id;
      list.push(group);
      return list;
    }, []);

    return users.concat(groups);
  },
  parseConversation(conversation) {
    let isChat = conversation.peer.type == 'chat',
        isChannel = isChat && conversation.chat_settings.is_group_channel,
        chatPhoto, chatTitle;

    if(isChat) {
      let photos = conversation.chat_settings.photo;

      chatPhoto = photos && photos.photo_50;
      chatTitle = conversation.chat_settings.title;
    }

    return {
      id: conversation.peer.id,
      type: conversation.peer.type,
      channel: isChannel,
      owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
      muted: !!conversation.push_settings, // TODO обработка disabled_until
      unread: conversation.unread_count || 0,
      photo: chatPhoto,
      title: chatTitle
    }
  },
  parseMessage(message, conversation) {
    if(message.geo) message.attachments.push({
      type: 'geo',
      geo: message.geo
    });

    let msg = {
      id: message.id,
      text: message.text,
      from: message.from_id,
      date: message.date,
      action: message.action,
      fwd_count: message.fwd_messages.length,
      attachments: message.attachments
    };

    if(conversation && conversation.peer) {
      msg.out = conversation.out_read != message.id && message.out;
    } else if(conversation && conversation.out != undefined) {
      msg.out = conversation.out;
    }

    return msg;
  },
  getLastMessage(peerID, force) {
    let state = app.$store.state,
        peer = state.dialogs.find((peer) => peer.id == peerID);

    if(!peer) return;
    if(force) return peer.items[peer.items.length - 1];
    
    return peer.items.slice().reverse().find((msg) => {
      return !msg.deleted;
    });
  }
}
