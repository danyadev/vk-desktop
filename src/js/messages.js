import { escape, getPhoto, fields, loadProfile, concatProfiles } from './utils';
import getTranslate from './getTranslate';
import store from './store';
import emoji from './emoji';
import vkapi from './vkapi';

const loadedConvMembers = {};

export function parseConversation(conversation) {
  const isChat = conversation.peer.id > 2e9;
  const isChannel = isChat && conversation.chat_settings.is_group_channel;
  const { push_settings, chat_settings } = conversation;

  return {
    id: conversation.peer.id,
    channel: isChannel,
    members: isChat && chat_settings.members_count,
    left: isChat && ['left', 'kicked'].includes(chat_settings.state),
    owner: isChannel ? chat_settings.owner_id : conversation.peer.id,
    muted: push_settings && push_settings.disabled_forever,
    unread: conversation.unread_count || 0,
    photo: isChat && getPhoto(chat_settings.photo),
    title: isChat && escape(chat_settings.title).replace(/\n/g, ' '),
    canWrite: conversation.can_write.allowed,
    keyboard: conversation.current_keyboard,
    last_msg_id: conversation.last_message_id,
    // id последнего прочтенного входящего сообщения
    in_read: conversation.in_read,
    // id последнего прочтенного исходящего сообщения
    out_read: conversation.out_read,
    mentions: conversation.mentions || [],
    pinnedMsg: isChat && chat_settings.pinned_message && parseMessage(chat_settings.pinned_message),
    loaded: true
  };
}

export function parseMessage(message) {
  if(message.geo) message.attachments.push({ type: 'geo' });

  const fwdCount = message.fwd_messages ? message.fwd_messages.length : 0;
  const isReplyMsg = !!message.reply_message;
  const hasAttachment = fwdCount || isReplyMsg || message.attachments.length;

  return {
    id: message.id,
    text: escape(message.text).replace(/\n/g, '<br>'),
    from: message.from_id,
    date: message.date,
    out: message.from_id == store.getters['users/user'].id,
    editTime: message.update_time || 0,
    hidden: message.is_hidden,
    action: message.action,
    fwdCount: fwdCount,
    fwdMessages: message.fwd_messages || [],
    isReplyMsg: isReplyMsg,
    replyMsg: isReplyMsg && parseMessage(message.reply_message),
    attachments: message.attachments,
    conversation_msg_id: message.conversation_message_id,
    random_id: message.random_id,
    was_listened: !!message.was_listened,
    hasAttachment: hasAttachment,
    isContentDeleted: !message.text && !message.action && !hasAttachment,
    keyboard: message.keyboard
  };
}

export function getServiceMessage(action, author, peer_id, isFull) {
  const actID = action.member_id || action.mid;
  const actUser = store.state.profiles[actID] || { id: actID };
  const { id } = store.getters['users/user'];
  const isAuthor = actID == author.id;

  function g(type) {
    const user = type ? actUser : author;

    if(user.id == id) return 0;
    if(user.sex == 1) return 2;
    return 1;
  }

  function e(text) {
    const escapedText = escape(String(text).replace(/<br>/g, ' '));

    // Эмодзи добавляются только для самого чата потому что
    // MessagesPeer сам добавляет эмодзи в текст
    return isFull ? emoji(escapedText) : escapedText;
  }

  function name(type, isAccCase) {
    const user = type ? actUser : author;

    if(user.id == id) return isAccCase ? getTranslate('you2') : getTranslate('you');
    else if(user.name) return user.name;
    else if(user.first_name) {
      if(isAccCase) return `${user.first_name_acc} ${user.last_name_acc}`;
      else return `${user.first_name} ${user.last_name}`;
    } else {
      if(!loadedConvMembers[peer_id]) {
        // В случае, когда юзеры в беседе не загружены
        loadConversationMembers(peer_id);
      } else {
        // При добавлении нового юзера в беседу
        loadProfile(user.id);
      }

      return '...';
    }
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
      if(action.message) return getTranslate('im_chat_pin_message', g(1), [name(1), e(action.message)]);
      else return getTranslate('im_chat_pin_empty_message', g(1), [name(1)]);
    case 'chat_unpin_message':
      return getTranslate('im_chat_unpin_message', g(1), [name(1)]);
    case 'chat_invite_user_by_link':
      return getTranslate('im_chat_invite_user_by_link', g(0), [name(0)]);
    case 'chat_invite_user':
      if(isAuthor) return getTranslate('im_chat_returned_user', g(0), [name(0)]);
      if(isFull) return getTranslate('im_chat_invite_user', g(0), [name(0), name(1, 1)]);
      return getTranslate('im_chat_invite_user_short', g(1), [name(1, 1)]);
    case 'chat_kick_user':
      if(isAuthor) return getTranslate('im_chat_left_user', g(0), [name(0)]);
      if(isFull) return getTranslate('im_chat_kick_user', g(0), [name(0), name(1, 1)]);
      return getTranslate('im_chat_kick_user_short', g(1), [name(1, 1)]);
    default:
      console.warn('[messages] Неизвестное действие:', action.type);
      return action.type;
  }
}

export function getMessagePreview(msg, peer_id, author) {
  if(msg.action) {
    return getServiceMessage(msg.action, author || { id: msg.from }, peer_id);
  } else if(msg.text) {
    return msg.text;
  } else if(msg.hasAttachment) {
    const { isReplyMsg, fwdCount, attachments } = msg;

    if(isReplyMsg) return getTranslate('im_replied');
    if(fwdCount < 0) return getTranslate('im_forwarded_some');
    if(fwdCount) return getTranslate('im_forwarded', [fwdCount], fwdCount);
    return getTranslate('im_attachments', attachments[0].type);
  }
}

export function getLastMsgId() {
  const [peer] = store.getters['messages/conversationsList'];

  return peer && peer.msg.id;
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

export async function loadConversationMembers(id, force) {
  if(!force && loadedConvMembers[id]) return;
  loadedConvMembers[id] = 1;

  if(id < 2e9) return loadProfile(id);

  try {
    const { profiles, groups } = await vkapi('messages.getConversationMembers', {
      peer_id: id,
      fields: fields
    });

    store.commit('addProfiles', concatProfiles(profiles, groups));
  } catch(err) {
    // Пользователь исключен/вышел из беседы, но т.к. юзер может вернуться,
    // здесь удаляется пометка беседы как загруженная для возможности повторить попытку
    if(err.error_code == 917) {
      delete loadedConvMembers[id];
    }
  }
}
