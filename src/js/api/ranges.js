/* eslint-disable import/no-unused-modules */

const USERS_LOWER_BOUND = 1;
const USERS_UPPER_BOUND = 1.9e9 - 1;

const GROUPS_LOWER_BOUND = -1e9 + 1;
const GROUPS_UPPER_BOUND = -1;

const EMAIL_UPPER_BOUND = -2e9 - 1;

const CONTACTS_LOWER_BOUND = 1.9e9 + 1;
const CONTACTS_UPPER_BOUND = 2e9 - 1;

const CHAT_MIN_ID = 1;
const CHAT_MAX_ID = 100e6;

const CHAT_PEER_LOWER_BOUND = 2e9 + CHAT_MIN_ID;
const CHAT_PEER_UPPER_BOUND = 2e9 + CHAT_MAX_ID;

export function isUserId(ownerId) {
  return ownerId >= USERS_LOWER_BOUND && ownerId <= USERS_UPPER_BOUND;
}

export function isGroupId(ownerId) {
  return ownerId >= GROUPS_LOWER_BOUND && ownerId <= GROUPS_UPPER_BOUND;
}

export function isOwnerId(value) {
  return isUserId(value) || isGroupId(value);
}

export function isEmailId(value) {
  return value <= EMAIL_UPPER_BOUND;
}

export function isContactId(value) {
  return value >= CONTACTS_LOWER_BOUND && value <= CONTACTS_UPPER_BOUND;
}

export function isChatId(value) {
  return value >= CHAT_MIN_ID && value <= CHAT_MAX_ID;
}

export function isChatPeerId(peerId) {
  return peerId >= CHAT_PEER_LOWER_BOUND && peerId <= CHAT_PEER_UPPER_BOUND;
}

// Конвертации айдишников

export function convertGroupIdToOwnerId(groupId) {
  if (groupId < 0) {
    return groupId;
  }

  return -groupId;
}

export function convertChatIdToChatPeerId(chatId) {
  return (CHAT_PEER_LOWER_BOUND - 1) + chatId;
}

export function convertChatPeerIdToChatId(chatPeerId) {
  return chatPeerId - (CHAT_PEER_LOWER_BOUND - 1);
}
