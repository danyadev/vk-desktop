import { getPhoto } from './utils';

export function parseConversation(conversation) {
  let isChat = conversation.peer.type == 'chat',
      isChannel = isChat && conversation.chat_settings.is_group_channel,
      chatPhoto, chatTitle;

  if(isChat) {
    let photos = conversation.chat_settings.photo;
    if(photos) chatPhoto = getPhoto(photos.photo_50, photos.photo_100);

    // escape
    chatTitle = conversation.chat_settings.title.replace(/\n/g, ' ');
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
    can_write: conversation.can_write,
    in_read: conversation.in_read,
    out_read: conversation.out_read
  }
}

export function parseMessage(message, conversation) {
  if(!message) return;

  if(message.geo) {
    message.attachments.push({
      type: 'geo',
      geo: message.geo
    });
  }

  let msg = {
    id: message.id,
    // escape
    text: message.text.replace(/\n/g, '<br>'),
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
    conversation_id: message.conversation_message_id,
    random_id: message.random_id
  }

  if(conversation) {
    Object.assign(msg, {
      unread: conversation.in_read < message.id,
      outread: conversation.out_read < message.id && message.out
    });
  }

  return msg;
}
