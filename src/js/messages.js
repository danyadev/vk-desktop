import { escape, getPhoto, fields, loadProfile, concatProfiles, capitalize } from './utils';
import getTranslate from './getTranslate';
import store from './store';
import emoji from './emoji';
import vkapi from './vkapi';

const loadedConvMembers = new Set();

export function parseConversation(conversation) {
  const isChat = conversation.peer.id > 2e9;
  const { push_settings, chat_settings } = conversation;

  return {
    id: conversation.peer.id,
    channel: isChat && chat_settings.is_group_channel,
    members: isChat && chat_settings.members_count,
    left: isChat && ['left', 'kicked'].includes(chat_settings.state),
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
  if(message.geo) message.attachments.push({ type: 'geo', geo: message.geo });

  const fwdCount = message.fwd_messages ? message.fwd_messages.length : 0;
  const isReplyMsg = !!message.reply_message;
  const hasAttachment = fwdCount || isReplyMsg || message.attachments.length;
  const attachments = {};

  for(const attachDescription of message.attachments) {
    let { type } = attachDescription;
    const attach = attachDescription[type];

    if(type == 'link') {
      const playlistRE = /https:\/\/m\.vk\.com\/audio\?act=audio_playlist(\d+)_(\d+)/;
      const artistRE = /https:\/\/m\.vk\.com\/artist\/(.+?)\?/;
      const articleRE = /https:\/\/m\.vk\.com\/@/;

      // TODO переписать структуру вложений
      if(playlistRE.test(attach.url)) {
        type = 'audio_playlist';
      } else if(artistRE.test(attach.url)) {
        type = 'artist';
      } else if(articleRE.test(attach.url)) {
        // articles.getByLink с ссылкой в поле links
        type = 'article';
      }
    }

    if(attachments[type]) attachments[type].push(attach);
    else attachments[type] = [attach];
  }

  return {
    id: message.id,
    text: escape(message.text).replace(/\n/g, '<br>'),
    from: message.from_id,
    date: message.date,
    out: message.from_id == store.state.users.activeUser,
    editTime: message.update_time || 0,
    hidden: message.is_hidden,
    action: message.action,
    fwdCount: fwdCount,
    fwdMessages: (message.fwd_messages || []).map(parseMessage),
    isReplyMsg: isReplyMsg,
    replyMsg: isReplyMsg && parseMessage(message.reply_message),
    attachments: attachments,
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
  const { activeUser: id } = store.state.users;
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
      if(!loadedConvMembers.has(peer_id)) {
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
      console.warn('[im] Неизвестное действие:', action.type);
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
    const [attachName] = Object.keys(attachments);

    if(attachName) {
      const count = attachments[attachName].length;
      const translate = getTranslate('im_attachments', attachName, [count], count);

      if(!translate) {
        console.warn('[im] Неизвестное вложение:', attachName);
        return capitalize(attachName);
      }

      return translate;
    }

    if(isReplyMsg) return getTranslate('im_replied');
    if(fwdCount < 0) return getTranslate('im_forwarded_some');

    return getTranslate('im_forwarded', [fwdCount], fwdCount);
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
  if(!force && loadedConvMembers.has(id)) return;
  loadedConvMembers.add(id);

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
      loadedConvMembers.delete(id);
    }
  }
}

const activeNotificationsTimers = new Map();

export function addNotificationsTimer({ peer_id, disabled_until }, remove) {
  if(activeNotificationsTimers.has(peer_id)) {
    clearTimeout(activeNotificationsTimers.get(peer_id));
  }

  if(remove) {
    return activeNotificationsTimers.delete(peer_id);
  }

  activeNotificationsTimers.set(peer_id, setTimeout(() => {
    activeNotificationsTimers.delete(peer_id);

    store.commit('messages/updateConversation', {
      peer: {
        id: peer_id,
        muted: false
      }
    });
  }, disabled_until * 1000 - Date.now()));
}
