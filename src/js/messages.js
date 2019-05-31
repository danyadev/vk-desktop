import { escape, getPhoto, fields, loadProfile, concatProfiles } from './utils';
import getTranslate from './getTranslate';
import store from './store';
import emoji, { getEmojiCode } from './emoji';
import vkapi from './vkapi';

export function parseConversation(conversation) {
  const isChat = conversation.peer.id > 2e9;
  const isChannel = isChat && conversation.chat_settings.is_group_channel;
  const { push_settings } = conversation;
  let chatPhoto, chatTitle;

  if(isChat) {
    chatPhoto = getPhoto(conversation.chat_settings.photo);
    chatTitle = escape(conversation.chat_settings.title).replace(/\n/g, ' ');
  }

  return {
    id: conversation.peer.id,
    channel: isChannel,
    members: isChat ? conversation.chat_settings.members_count : null,
    left: isChat ? ['left', 'kicked'].includes(conversation.chat_settings.state) : false,
    owner: isChannel ? conversation.chat_settings.owner_id : conversation.peer.id,
    muted: push_settings && push_settings.disabled_forever,
    unread: conversation.unread_count || 0,
    photo: chatPhoto,
    title: chatTitle,
    canWrite: conversation.can_write.allowed,
    last_msg_id: conversation.last_message_id,
    // id последнего прочтенного входящего сообщения
    in_read: conversation.in_read,
    // id последнего прочтенного исходящего сообщения
    out_read: conversation.out_read,
    loaded: true
  }
}

export function parseMessage(message) {
  if(message.geo) {
    message.attachments.push({
      type: 'geo',
      geo: message.geo
    });
  }

  return {
    id: message.id,
    text: escape(message.text).replace(/\n/g, '<br>'),
    from: message.from_id,
    date: message.date,
    out: message.from_id == store.getters['users/user'].id,
    editTime: message.update_time || 0,
    hidden: message.is_hidden,
    action: message.action,
    fwdCount: message.fwd_messages ? message.fwd_messages.length : 0,
    isReplyMsg: !!message.reply_message,
    fwdMessages: message.fwd_messages || [],
    replyMsg: message.reply_message,
    attachments: message.attachments,
    conversation_msg_id: message.conversation_message_id,
    random_id: message.random_id
  };
}

export function getServiceMessage(action, author, isFull) {
  const actID = action.member_id || action.mid;
  const actUser = store.state.profiles[actID] || { id: actID };
  const { id } = store.getters['users/user'];
  const isAuthor = actID == author.id;

  function g(type) {
    const user = type ? actUser : author;

    if(user.id == id) return 0;
    else if(user.sex == 1) return 2;
    else return 1;
  }

  function e(text) {
    text = escape(String(text).replace(/<br>/g, ' '));

    if(isFull) text = emoji(text);

    return text;
  }

  function name(type, isAccCase) {
    const user = type ? actUser : author;

    if(user.id == id) return isAccCase ? getTranslate('you2') : getTranslate('you');
    else if(user.name) return user.name;
    else if(user.first_name) {
      if(isAccCase) return `${user.first_name_acc} ${user.last_name_acc}`;
      else return `${user.first_name} ${user.last_name}`;
    } else return loadProfile(user.id), '...';
  }

  switch(action.type) {
    case 'chat_photo_update':
      return getTranslate('im_chat_photo_update', g(0), [name(0)]);
    case 'chat_photo_remove':
      return getTranslate('im_chat_photo_remove', g(0), [name(0)]);
    case 'chat_create':
      return getTranslate('im_chat_create', g(0), [name(0), e(action.text)]);
    case 'chat_title_update':
      return getTranslate('im_chat_title_update', g(0), [name(0), e(action.text)]);
    case 'chat_pin_message':
      return getTranslate('im_chat_pin_message', g(1), [name(1), e(action.message)]);
    case 'chat_unpin_message':
      return getTranslate('im_chat_unpin_message', g(1), [name(1)]);
    case 'chat_invite_user_by_link':
      return getTranslate('im_chat_invite_user_by_link', g(0), [name(0)]);
    case 'chat_invite_user':
      if(isAuthor) return getTranslate('im_chat_returned_user', g(0), [name(0)]);
      else if(isFull) return getTranslate('im_chat_invite_user', g(0), [name(0), name(1, 1)]);
      else return getTranslate('im_chat_invite_user_short', g(1), [name(1, 1)]);
    case 'chat_kick_user':
      if(isAuthor) return getTranslate('im_chat_left_user', g(0), [name(0)]);
      else if(isFull) return getTranslate('im_chat_kick_user', g(0), [name(0), name(1, 1)]);
      else return getTranslate('im_chat_kick_user_short', g(1), [name(1, 1)]);
    default:
      console.warn('[messages] Неизвестное действие:', action.type);
      return action.type;
  }
}

export function getTextWithEmoji(nodes) {
  const emojis = {};
  let text = '';

  for(const node of nodes || []) {
    switch(node.nodeName) {
      case 'IMG':
        const code = getEmojiCode(node.alt);

        emojis[code] = (emojis[code] || 0) + 1;
        text += node.alt;
        break;
      case 'BR':
        text += '<br>';
        break;
      default:
        text += node.data || node.innerText || '';
        break
    }
  }

  return {
    text: text.trim(),
    emojis: emojis
  }
}

export async function loadConversation(id) {
  const { items: [conv], profiles, groups } = await vkapi('messages.getConversationsById', {
    peer_ids: id,
    extended: 1,
    fields: fields
  });

  store.commit('addProfiles', concatProfiles(profiles, groups));
  store.commit('messages/updateConversation', {
    peer: parseConversation(conv)
  });
}

const loadedConvMembers = {};

export async function loadConversationMembers(id, force) {
  if(!force && loadedConvMembers[id]) return;
  else loadedConvMembers[id] = 1;

  try {
    const { profiles, groups } = await vkapi('messages.getConversationMembers', {
      peer_id: id,
      fields: fields
    });

    store.commit('addProfiles', concatProfiles(profiles, groups));
  } catch(e) {
    delete loadedConvMembers[id];
  }
}
