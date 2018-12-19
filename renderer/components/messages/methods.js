'use strict';

let loadingProfiles = [], currentLoadUsers = [],
    appNames = {}, loadindPeers = {};

async function getProfiles() {
  let ids = loadingProfiles.slice().splice(0, 100);
  if(other.isEqual(ids, currentLoadUsers)) return;
  currentLoadUsers = ids;

  let profiles = await vkapi('execute.getProfiles', {
    profile_ids: ids.join(',')
  });

  app.$store.commit('addProfiles', profiles);

  loadingProfiles.splice(0, ids.length);
  if(loadingProfiles.length) getProfiles();
}

async function getUsersOnline(users) {
  let appIDs = [];

  for(let user of users) {
    if(user.online_app) {
      if(appNames[user.online_app]) {
        user.online_device = appNames[user.online_app];
      } else appIDs.push(user.online_app);
    }
  }

  let { items: apps } = await vkapi('apps.get', {
    app_ids: appIDs.join(',')
  });

  for(let user of users) {
    if(!user.online) continue;

    let app = apps.find((app) => app.id == user.online_app);

    if(app) {
      user.online_device = app.title;
      appNames[app.id] = app.title;
    }
  }

  return users;
}

async function concatProfiles(users = [], groups = []) {
  groups = groups.reduce((list, group) => {
    group.id = -group.id;
    list.push(group);
    return list;
  }, []);

  users = await getUsersOnline(users);

  return users.concat(groups);
}

function parseConversation(conversation) {
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
    members: isChat ? conversation.chat_settings.members_count : null,
    left: isChat ? conversation.chat_settings.state == 'left' : false,
    owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
    muted: !!conversation.push_settings, // TODO обработка disabled_until
    unread: conversation.unread_count || 0,
    photo: chatPhoto,
    title: chatTitle,
    canWrite: conversation.can_write,
    in_read: conversation.in_read,
    out_read: conversation.out_read
  }
}

module.exports = {
  concatProfiles,
  parseConversation,
  parseMessage(message, conversation) {
    if(message.geo) {
      message.attachments.push({
        type: 'geo',
        geo: message.geo
      });
    }

    if(message.reply_message) {
      message.fwd_messages.push(message.reply_message);
    }

    let msg = {
      id: message.id,
      text: message.text.replace(/\n/g, '<br>'),
      from: message.from_id,
      date: message.date,
      edited: !!message.update_time,
      action: message.action,
      fwd_count: message.fwd_messages.length,
      attachments: message.attachments
    }

    if(conversation && conversation.out_read != undefined) {
      msg.outread = conversation.out_read < message.id && message.out;
    } else if(conversation && conversation.outread != undefined) {
      msg.outread = conversation.outread;
    }

    return msg;
  },
  loadProfile(id) {
    if(!id || loadingProfiles.includes(id) || id > 2e9) return;
    else loadingProfiles.push(id);

    getProfiles();
  },
  async loadOnlineApp(id) {
    let users = await vkapi('execute.getProfiles', {
      profile_ids: id
    });

    app.$store.commit('addProfiles', users);
  },
  loadConversation(id) {
    return new Promise(async (resolve, reject) => {
      if(id in loadindPeers) return;
      else loadindPeers[id] = true;

      let { items: [conv], profiles = [], groups = [] } = await vkapi('messages.getConversationsById', {
        peer_ids: id,
        extended: 1,
        fields: other.fields
      });

      app.$store.commit('addProfiles', await concatProfiles(profiles, groups));
      delete loadindPeers[id];
      resolve(parseConversation(conv));
    });
  }
}
