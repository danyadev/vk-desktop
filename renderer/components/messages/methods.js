'use strict';

let loadingProfiles = [], currentLoadUsers = [],
    appNames = {}, loadindPeers = {};

async function getUsersOnline(users) {
  let appIDs = [];

  for(let user of users) {
    if(user.online_app) {
      if(appNames[user.online_app]) {
        user.online_device = appNames[user.online_app];
      } else appIDs.push(user.online_app);
    }
  }

  if(appIDs.length) {
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
  }

  return users;
}

function concatProfiles(users = [], groups = []) {
  groups = groups.reduce((list, group) => {
    group.id = -group.id;
    list.push(group);
    return list;
  }, []);

  return users.concat(groups);
}

async function getProfiles() {
  let ids = loadingProfiles.slice().splice(0, 100);
  if(utils.isEqual(ids, currentLoadUsers)) return;
  currentLoadUsers = ids;

  let profiles = await vkapi('execute.getProfiles', {
    profile_ids: ids.join(',')
  });

  app.$store.commit('addProfiles', profiles);

  loadingProfiles.splice(0, ids.length);
  if(loadingProfiles.length) getProfiles();
}

function loadProfile(id) {
  if(!id || loadingProfiles.includes(id) || id > 2e9) return;
  else loadingProfiles.push(id);

  getProfiles();
}

async function loadOnlineApp(id) {
  let users = await vkapi('execute.getProfiles', {
    profile_ids: id
  });

  app.$store.commit('addProfiles', users);
}

function loadConversation(id) {
  return new Promise(async (resolve, reject) => {
    if(id in loadindPeers) return;
    else loadindPeers[id] = true;

    let { items: [conv], profiles = [], groups = [] } = await vkapi('messages.getConversationsById', {
      peer_ids: id,
      extended: 1,
      fields: utils.fields
    });

    app.$store.commit('addProfiles', concatProfiles(profiles, groups));
    delete loadindPeers[id];
    resolve(parseConversation(conv));
  });
}

function parseConversation(conversation) {
  let isChat = conversation.peer.type == 'chat',
      isChannel = isChat && conversation.chat_settings.is_group_channel,
      chatPhoto, chatTitle;

  if(isChat) {
    let photos = conversation.chat_settings.photo;

    if(photos) {
      chatPhoto = devicePixelRatio >= 2 ? photos.photo_100 : photos.photo_50;
    }

    chatTitle = utils.escape(conversation.chat_settings.title).replace(/\n/g, ' ');
  }

  return {
    id: conversation.peer.id,
    type: conversation.peer.type,
    channel: isChannel,
    members: isChat ? conversation.chat_settings.members_count : null,
    left: isChat ? conversation.chat_settings.state == 'left' : false,
    owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
    muted: !!conversation.push_settings,
    unread: conversation.unread_count || 0,
    photo: chatPhoto,
    title: chatTitle,
    canWrite: conversation.can_write,
    in_read: conversation.in_read,
    out_read: conversation.out_read
  }
}

function parseMessage(message, conversation) {
  if(!message) return;

  if(message.geo) {
    message.attachments.push({
      type: 'geo',
      geo: message.geo
    });
  }

  let msg = {
    id: message.id,
    text: utils.escape(message.text).replace(/\n/g, '<br>'),
    from: message.from_id,
    date: message.date,
    editTime: message.update_time || 0,
    hidden: message.is_hidden,
    action: message.action,
    fwdCount: message.fwd_messages ? message.fwd_messages.length : 0,
    isReplyMsg: !!message.reply_message,
    fwdMessages: message.fwd_messages || [],
    replyMsg: message.reply_message,
    attachments: message.attachments,
    conversationMsgId: message.conversation_message_id,
    random_id: message.random_id,
    loaded: true
  }

  if(conversation) {
    Object.assign(msg, {
      unread: conversation.in_read < message.id,
      outread: conversation.out_read < message.id && message.out
    });
  }

  return msg;
}

async function loadAttachments(message, peer_id) {
  let hasPhotoUpdate = message.action && message.action.type == 'chat_photo_update',
      hasFwdOrReplyMsg = message.isReplyMsg || message.fwdCount,
      attachs = message.attachments;

  if(hasPhotoUpdate || message.attachments.length || hasFwdOrReplyMsg) {
    let { items: [msg] } = await vkapi('messages.getById', { message_ids: message.id });

    app.$store.commit('editMessage', {
      peer_id: peer_id,
      msg: parseMessage(msg)
    });
  }
}

function getServiceMessage(action, author, full) {
  let actID = action.member_id || action.mid,
      actUser = app.$store.state.profiles[actID] || { id: actID },
      id = app.user.id;

  function g(type) {
    let user = type ? actUser : author;

    if(user.id == id) return 0;
    else if(user.sex == 1) return 2;
    else return 1;
  }

  function e(text) {
    return emoji(utils.escape(text)).replace(/<br>/g, ' ');
  }

  function name(type, acc) {
    let user = type ? actUser : author, name;

    if(user.id == id) name = acc ? app.l('you2') : app.l('you');
    else if(user.name) name = user.name;
    else if(user.first_name) {
      if(acc) name = `${user.first_name_acc} ${user.last_name_acc}`;
      else name = `${user.first_name} ${user.last_name}`;
    } else {
      loadProfile(user.id);
      name = '...';
    }

    return e(name);
  }

  switch(action.type) {
    case 'chat_photo_update':
      return app.l('im_chat_photo_update', g(0), [name(0)]);
    case 'chat_photo_remove':
      return app.l('im_chat_photo_remove', g(0), [name(0)]);
    case 'chat_create':
      return app.l('im_chat_create', g(0), [name(0), e(action.text)]);
    case 'chat_title_update':
      return app.l('im_chat_title_update', g(0), [name(0), e(action.text)]);
    case 'chat_pin_message':
      return app.l('im_chat_pin_message', g(1), [name(1), e(action.message)]);
    case 'chat_unpin_message':
      return app.l('im_chat_unpin_message', g(1), [name(1)]);
    case 'chat_invite_user_by_link':
      return app.l('im_chat_invite_user_by_link', g(0), [name(0)]);
    case 'chat_invite_user':
      if(actID == author.id) return app.l('im_chat_returned_user', g(0), [name(0)]);
      else if(full) return app.l('im_chat_invite_user', g(0), [name(0), name(1, 1)]);
      else return app.l('im_chat_invite_user_short', g(1), [name(1, 1)]);
    case 'chat_kick_user':
      if(actID == author.id) return app.l('im_chat_left_user', g(0), [name(0)]);
      else if(full) return app.l('im_chat_kick_user', g(0), [name(0), name(1, 1)]);
      else return app.l('im_chat_kick_user_short', g(1), [name(1, 1)]);
    default:
      console.warn('[messages] Неизвестное действие:', action.type);
      return action.type;
  }
}

function getDate(timestamp, { addTime, shortMonth, fullText } = {}) {
  let thisDate = new Date(),
      date = new Date(timestamp * 1000),
      f = (t) => t < 10 ? `0${t}` : t,
      months = app.l('months');

  let thisYear = thisDate.getFullYear() == date.getFullYear(),
      thisMonth = thisYear && thisDate.getMonth() == date.getMonth(),
      thisDay = thisMonth && thisDate.getDate() == date.getDate(),
      yesterday = thisMonth && thisDate.getDate() - 1 == date.getDate(),
      time = `${f(date.getHours())}:${f(date.getMinutes())}`,
      month = months[date.getMonth()];

  if(shortMonth && month.length > 3) month = month.slice(0, 3) + '.';

  if(thisDay) {
    if(fullText) return app.l('today') + ' ' + app.l('at_n', [time]);
    else return addTime ? time : app.l('today');
  } else if(yesterday) return app.l('yesterday');
  else if(thisYear) return `${date.getDate()} ${month}`;
  else return `${date.getDate()} ${month} ${date.getFullYear()}`;
}

function getTextWithEmoji(nodes) {
  let text = '', emojies = {};

  for(let node of nodes || []) {
    if(node.nodeName == 'IMG') {
      text += node.alt;

      let code = emoji.emojiToHex(node.alt);
      emojies[code] = (emojies[code] || 0) + 1;
    } else if(node.nodeName == 'BR') text += '<br>';
    else text += node.data || node.innerText || '';
  }

  return {
    text: text.trim(),
    emojies
  }
}

function getMessagePreview(msg, author) {
  function getAttachment(message, attachment) {
    if(!attachment || message) return message;

    if(attachment.type == 'link' && attachment.link) {
      if(attachment.link.url.match('https://m.vk.com/story')) attachment.type = 'story';
    }

    let attachName = app.l('attachments', attachment.type);

    if(!attachName) {
      console.warn('[messages] Неизвестное вложение:', attachment.type);
    }

    return attachName || app.l('attach');
  }

  if(msg.action) {
    return getServiceMessage(msg.action, author || { id: msg.from });
  } else if(msg.isReplyMsg && !msg.text) {
    return app.l('reply_msg');
  } else if(msg.fwdCount && !msg.text) {
    return app.l('fwd_msg', [msg.fwdCount], msg.fwdCount);
  } else {
    return getAttachment(msg.text, msg.attachments[0]);
  }
}

function isDeletedContent(msg) {
  return !(msg.text || msg.attachments.length || msg.action || msg.fwdCount || msg.isReplyMsg);
}

module.exports = {
  concatProfiles,
  loadProfile,
  loadOnlineApp,
  loadConversation,
  parseConversation,
  parseMessage,
  loadAttachments,
  getServiceMessage,
  getDate,
  getTextWithEmoji,
  getMessagePreview,
  isDeletedContent
}
