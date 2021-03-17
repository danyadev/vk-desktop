import { escape, getPhoto, fields, concatProfiles, capitalize, getAppName } from './utils';
import { openModal } from 'js/modals';
import { getLastOnlineDate } from './date';
import vkapi from './vkapi';
import store from './store';
import getTranslate from './getTranslate';

export function parseConversation(conversation) {
  const isChat = conversation.peer.id > 2e9;
  const { push_settings, chat_settings } = conversation;
  const isCasperChat = isChat && !!chat_settings.is_disappearing;

  return {
    id: conversation.peer.id,
    isChannel: isChat && !!chat_settings.is_group_channel,
    isCasperChat,
    members: isChat ? chat_settings.members_count : null,
    left: isChat && ['left', 'kicked'].includes(chat_settings.state),
    muted: !!(push_settings && (push_settings.disabled_forever || push_settings.disabled_until)),
    unread: conversation.unread_count || 0,
    photo: isChat ? getPhoto(chat_settings.photo) : null,
    title: isChat ? escape(chat_settings.title).replace(/\n/g, ' ') : null,
    // 946 причина означает, что это фантомный чат и туда можно писать
    isWriteAllowed: conversation.can_write.reason === 946 || conversation.can_write.allowed,
    keyboard: conversation.current_keyboard,
    last_msg_id: isCasperChat
      ? conversation.sort_id.minor_id
      : conversation.last_message_id,
    // id последнего прочтенного входящего сообщения
    in_read: conversation.in_read,
    // id последнего прочтенного исходящего сообщения
    out_read: conversation.out_read,
    mentions: conversation.mentions || [],
    pinnedMsg: isChat && chat_settings.pinned_message
      ? parseMessage(chat_settings.pinned_message)
      : null,
    acl: isChat ? chat_settings.acl : null,
    chatState: isChat ? chat_settings.state : null,
    owner_id: isChat ? chat_settings.owner_id : null,
    admin_ids: isChat && chat_settings.admin_ids || [],
    loaded: true
  };
}

export function parseMessage(message) {
  if (message.geo) {
    message.attachments.push({
      type: 'geo',
      geo: message.geo
    });
  }

  // Поле fwd_messages отсутствует в ответе на сообщение, пересланных сообщениях и закрепе
  const fwdCount = message.fwd_messages ? message.fwd_messages.length : 0;
  const hasReplyMsg = !!message.reply_message;
  const hasAttachment = !!(fwdCount || hasReplyMsg || message.attachments.length);

  return {
    id: message.id,
    from: message.from_id,
    out: message.from_id === store.state.users.activeUserID,
    text: escape(message.text).replace(/\n/g, '<br>'),
    date: message.date,
    peer_id: message.peer_id,
    conversation_msg_id: message.conversation_message_id,
    random_id: message.random_id,
    action: message.action,
    hasAttachment,
    fwdCount,
    fwdMessages: (message.fwd_messages || []).map(parseMessage),
    attachments: parseAttachments(message.attachments),
    hasReplyMsg,
    replyMsg: hasReplyMsg ? parseMessage(message.reply_message) : null,
    keyboard: message.keyboard,
    hasTemplate: !!message.template,
    template: message.template,
    hidden: !!message.is_hidden,
    editTime: message.update_time || 0,
    was_listened: !!message.was_listened,
    isContentDeleted: !message.text && !message.action && !hasAttachment,
    expireTtl: message.expire_ttl || message.ttl || 0,
    isExpired: !!message.is_expired,
    fromLongPoll: false
  };
}

export function parseAttachments(list) {
  const attachments = {};

  for (const attachDescription of list) {
    let { type } = attachDescription;
    const attach = attachDescription[type];

    if (type === 'link') {
      const types = {
        audio_playlist: 'https://m.vk.com/audio?act=audio_playlist',
        narrative: 'https://m.vk.com/narrative',
        article: 'https://m.vk.com/@',
        artist: 'https://m.vk.com/artist/'
      };

      for (const [newType, startOfLink] of Object.entries(types)) {
        if (attach.url.startsWith(startOfLink)) {
          type = newType;
          break;
        }
      }
    }

    if (attachments[type]) {
      attachments[type].push(attach);
    } else {
      attachments[type] = [attach];
    }
  }

  return attachments;
}

export function getMessagePreview(msg) {
  if (msg.text) {
    return msg.text;
  }

  const { hasReplyMsg, fwdCount, attachments } = msg;
  const [attachName] = Object.keys(attachments);

  if (attachName) {
    const count = attachments[attachName].length;
    const translate = (
      getTranslate('im_attachments', attachName, [count], count) ||
      getTranslate('im_attachments', attachName, [1], 1)
    );

    if (!translate) {
      console.warn('[im] Неизвестное вложение:', attachName, `(${count})`);
      return capitalize(attachName);
    }

    return translate;
  }

  if (hasReplyMsg) {
    return getTranslate('im_replied');
  }

  if (fwdCount < 0) {
    return getTranslate('im_forwarded_some');
  }

  return getTranslate('im_forwarded', [fwdCount], fwdCount);
}

export function getPeerOnline(peer_id, peer, owner) {
  if (!peer || !peer.left && peer_id > 2e9 && peer.members == null) {
    return getTranslate('loading');
  }

  if (peer_id < 0) {
    return getTranslate('im_chat_group');
  }

  if (peer_id > 2e9) {
    const { chatState, members, isChannel, left } = peer;

    if (chatState === 'kicked') {
      return getTranslate('im_chat_kicked', isChannel);
    } else if (left) {
      return getTranslate('im_chat_left', isChannel);
    } else {
      return getTranslate('im_chat_members', [members], members);
    }
  }

  if (!owner) {
    return getTranslate('loading');
  }

  if (owner.deactivated) {
    return getTranslate('im_user_deleted');
  }

  const { online, online_mobile, online_app, online_info, last_seen, sex } = owner;

  if (online) {
    const appName = online_app > 0 && getAppName(online_app);

    if (appName) {
      return getTranslate('im_chat_online', 2, [appName]);
    } else {
      return getTranslate('im_chat_online', online_mobile ? 1 : 0);
    }
  }

  const isGirl = sex === 1;

  if (!online_info.visible) {
    return getTranslate(`im_chat_online_${online_info.status}`, isGirl);
  }

  if (last_seen) {
    return getLastOnlineDate(new Date(last_seen.time * 1000), isGirl);
  }

  // У @id333 не приходит last_seen
  return '';
}

export function getPeerAvatar(peer_id, peer, owner) {
  if (peer_id > 2e9) {
    return peer && !peer.left && peer.photo || 'assets/im_chat_photo.png';
  } else {
    return getPhoto(owner) || 'assets/blank.gif';
  }
}

export function getPeerTitle(peer_id, peer, owner) {
  if (peer_id > 2e9) {
    return peer && peer.title || '...';
  } else if (owner) {
    return owner.name || `${owner.first_name} ${owner.last_name}`;
  }

  return '...';
}

export function getMessageById(msg_id, peer_id) {
  return store.state.messages.messages[peer_id].find((msg) => msg.id === msg_id);
}

export function deleteMessages(message_ids, peer, needCancelSelect) {
  const { activeUserID } = store.state.users;
  const DAY = 1000 * 60 * 60 * 24;
  const messages = message_ids.map((id) => getMessageById(id, peer.id));
  const isChatOwner = peer.owner_id === activeUserID;

  const canDeleteForAll = (
    activeUserID !== peer.id &&
    messages.every((msg) => (
      Date.now() - msg.date * 1000 < DAY &&
      (isChatOwner || !peer.admin_ids.includes(msg.from) && msg.from !== peer.owner_id) &&
      (
        msg.from === activeUserID ||
        peer.id > 2e9 && peer.acl.can_moderate
      )
    ))
  );

  openModal('delete-messages', {
    count: message_ids.length,
    canDeleteForAll,

    async submit(deleteForAll) {
      const chatAdmins = [];

      if (isChatOwner) {
        for (const msg of messages) {
          if (peer.admin_ids.includes(msg.from)) {
            chatAdmins.push(msg.from);
          }
        }
      }

      await vkapi('execute.deleteMessages', {
        peer_id: peer.id,
        message_ids: message_ids.join(','),
        for_all: deleteForAll ? 1 : 0,
        admins: chatAdmins.join(',')
      });

      if (needCancelSelect) {
        store.commit('messages/removeSelectedMessages');
      }
    }
  });
}

const loadingConversations = new Set();

export async function loadConversation(id) {
  if (loadingConversations.has(id)) {
    return;
  }

  loadingConversations.add(id);

  const { items: [conversation], profiles, groups } = await vkapi('messages.getConversationsById', {
    peer_ids: id,
    extended: 1,
    fields
  });

  store.commit('addProfiles', concatProfiles(profiles, groups));
  store.commit('messages/updateConversation', {
    peer: parseConversation(conversation)
  });

  loadingConversations.delete(id);
}

export const loadedConversationMembers = new Set();

export async function loadConversationMembers(id, force) {
  if (loadedConversationMembers.has(id) && !force) {
    return;
  }

  loadedConversationMembers.add(id);

  try {
    const { profiles, groups } = await vkapi('messages.getConversationMembers', {
      peer_id: id,
      fields
    });

    store.commit('addProfiles', concatProfiles(profiles, groups));
  } catch (err) {
    // Пользователь исключен/вышел из беседы, но т.к. юзер может вернуться,
    // здесь удаляется пометка беседы как загруженная для возможности повторить попытку
    if (err.error_code === 917) {
      loadedConversationMembers.delete(id);
    } else {
      throw err;
    }
  }
}

const activeNotificationsTimers = new Map();

export function addNotificationsTimer({ peer_id, disabled_until }, remove) {
  if (activeNotificationsTimers.has(peer_id)) {
    clearTimeout(activeNotificationsTimers.get(peer_id));
  }

  if (remove) {
    return activeNotificationsTimers.delete(peer_id);
  }

  activeNotificationsTimers.set(
    peer_id,
    setTimeout(() => {
      activeNotificationsTimers.delete(peer_id);

      store.commit('messages/updateConversation', {
        peer: {
          id: peer_id,
          muted: false
        }
      });
    }, disabled_until * 1000 - Date.now())
  );
}

export const activeKeyboardCallbackButtons = {};
