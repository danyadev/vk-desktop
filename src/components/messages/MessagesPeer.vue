<template>
  <div
    :class="['im_peer', { active: isOpenedChat }]"
    data-context-menu="peer"
    :data-peer-id="peer.id"
    @click="openChat"
  >
    <div :class="['im_peer_photo', online]">
      <img :src="photo" loading="lazy" width="50" height="50">
    </div>

    <div class="im_peer_content">
      <div class="im_peer_title">
        <div class="im_peer_name_wrap">
          <div :class="['im_peer_name text-overflow', { blueName }]">
            <VKText>{{ chatName }}</VKText>
          </div>
          <Icon v-if="owner && owner.verified" name="verified" class="verified" />
          <Icon
            v-if="peer.isCasperChat"
            name="ghost"
            color="var(--icon-dark-blue)"
            class="im_peer_ghost"
          />
          <Icon v-if="peer.muted" name="muted" color="var(--icon-gray)" class="im_peer_muted" />
        </div>

        <Icon
          v-if="isPinned"
          name="pin"
          color="var(--icon-gray)"
          width="16"
          height="16"
          class="im_peer_pinned"
        />

        <div v-if="messageTime.type === 'long'" class="im_peer_time">{{ messageTime.text }}</div>
      </div>

      <div class="im_peer_message_wrap">
        <Typing v-if="hasTyping" :peer_id="peer.id" />

        <div v-else-if="msg.id" class="im_peer_message">
          <div class="im_peer_text_wrap text-overflow">
            <div class="im_peer_author">{{ authorName }}</div>

            <div v-if="msg.isContentDeleted" class="im_peer_text isContentDeleted">
              {{ l(msg.isExpired ? 'is_message_expired' : 'im_attachment_deleted') }}
            </div>
            <div v-else :class="['im_peer_text', { hasAttachment }]">
              <ServiceMessage
                v-if="msg.action"
                :msg="msg"
                :author="author"
                :peer_id="peer.id"
              />
              <VKText v-else preview>{{ message }}</VKText>
            </div>
          </div>

          <template v-if="messageTime.type === 'short' && messageTime.text">
            <div class="message_dot"></div>
            <div class="im_peer_short_time">{{ messageTime.text }}</div>
          </template>
        </div>

        <div v-else class="im_peer_text isContentDeleted">
          {{ l(peer.isCasperChat ? 'im_messages_disappeared' : 'im_no_messages') }}
        </div>

        <div v-if="peer.mentions.length" class="im_peer_mentioned">
          <Icon name="mention" color="var(--background-blue-text)" width="20" height="18" />
        </div>

        <div
          :class="['im_peer_unread', { outread, muted: peer.muted }]"
          :title="peer.unread || ''"
        >
          {{ convertCount(peer.unread || '') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { convertCount, eventBus } from 'js/utils';
import {
  getMessagePreview,
  loadConversationMembers,
  getPeerAvatar,
  getPeerTitle
} from 'js/messages';
import { getShortTime } from 'js/date';
import store from 'js/store';
import router from 'js/router';
import getTranslate from 'js/getTranslate';

import Icon from '../UI/Icon.vue';
import VKText from '../UI/VKText.vue';
import Typing from './Typing.vue';
import ServiceMessage from './ServiceMessage.vue';

export default {
  props: ['peer', 'msg', 'activeChat', 'nowDate'],

  components: {
    Icon,
    VKText,
    Typing,
    ServiceMessage
  },

  setup(props) {
    const state = reactive({
      route: router.currentRoute,

      isChat: props.peer.id > 2e9,
      owner: computed(() => store.state.profiles[props.peer.id]),
      author: computed(() => store.state.profiles[props.msg.from]),
      blueName: computed(() => [100, 101, 333].includes(Number(props.peer.id))),
      message: computed(() => props.msg.id && getMessagePreview(props.msg)),
      hasAttachment: computed(() => (
        !props.msg.text && !props.msg.action && props.msg.hasAttachment
      )),
      outread: computed(() => props.msg.id && props.peer.out_read !== props.peer.last_msg_id),
      photo: computed(() => getPeerAvatar(props.peer.id, props.peer, state.owner)),
      chatName: computed(() => getPeerTitle(props.peer.id, props.peer, state.owner)),
      isOpenedChat: computed(() => props.activeChat === props.peer.id),
      isPinned: computed(() => store.state.messages.pinnedPeers.includes(props.peer.id)),

      online: computed(() => {
        if (state.owner && state.owner.online) {
          return state.owner.online_mobile ? 'mobile' : 'desktop';
        }
      }),

      messageTime: computed(() => (
        props.msg.date ? getShortTime(new Date(props.msg.date * 1000), props.nowDate) : {}
      )),

      hasTyping: computed(() => {
        const typing = store.state.messages.typing[props.peer.id] || {};
        return Object.keys(typing).length;
      }),

      authorName: computed(() => {
        if (props.msg.action || props.peer.isChannel) {
          return '';
        } else if (props.msg.out) {
          return `${getTranslate('you')}:`;
        } else if (!state.isChat) {
          return '';
        } else if (state.author) {
          return `${state.author.name || state.author.first_name}:`;
        }

        loadConversationMembers(props.peer.id);

        return '...:';
      })
    });

    async function openChat() {
      const { activeChat } = props;
      const peer_id = props.peer.id;
      const isForwardTo = state.route.name === 'forward-to';

      store.commit('messages/closeMessagesViewer');

      if (state.isOpenedChat) {
        return eventBus.emit('messages:event', 'jump', {
          peer_id: activeChat,
          bottom: true
        });
      }

      const updateMethod = state.route.name === 'chat' ? 'replace' : 'push';

      await router[updateMethod]({
        name: 'chat',
        params: {
          id: peer_id,
          fromId: state.route.params.fromId
        }
      });

      if (isForwardTo) {
        store.commit('messages/updatePeerConfig', {
          peer_id,
          replyMsg: null,
          fwdMessages: store.state.messages.tmpForwardingMessages
        });
        store.state.messages.tmpForwardingMessages = [];
      }
    }

    return {
      ...toRefs(state),

      convertCount,
      openChat
    };
  }
};
</script>

<style>
.im_peer {
  display: flex;
  position: relative;
  border-radius: 8px;
  margin: 0 8px;
  cursor: pointer;
  transition: background-color .3s;
}

.im_peer:hover {
  background: var(--messages-peer-hover);
}

.im_peer.active {
  background: var(--messages-peer-active);
}

.im_peer_photo {
  position: relative;
  width: 50px;
  height: 50px;
  margin: 8px 10px 8px 8px;
}

.im_peer_photo,
.im_peer_photo img {
  border-radius: 50%;
}

.im_peer_photo.mobile::after,
.im_peer_photo.desktop::after {
  content: '';
  position: absolute;
  box-sizing: content-box;
  width: 8px;
  bottom: 2px;
  right: -1px;
  border: 2px solid var(--background);
}

.im_peer_photo.mobile::after {
  height: 11px;
  border-radius: 3px;
  background: url('~assets/online_mobile.svg') no-repeat var(--background);
}

.im_peer_photo.desktop::after {
  height: 8px;
  border-radius: 50%;
  background: var(--green);
}

.im_peer_content {
  width: calc(100% - 68px);
  padding: 8px 8px 8px 0;
}

.im_peer_title {
  display: flex;
  margin-top: 5px;
}

.im_peer_name_wrap {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  font-weight: 500;
}

.im_peer_name {
  height: 20px;
  line-height: 18px;
}

.im_peer_name.blueName {
  color: var(--text-blue);
}

.im_peer_title .verified {
  flex: none;
  margin: 3px 0 0 4px;
}

.im_peer_ghost {
  flex: none;
  margin: 1px 0 0 3px;
}

.im_peer_muted {
  flex: none;
  width: 13px;
  height: 13px;
  margin: 3px 0 0 3px;
}

.im_peer_pinned {
  flex: none;
  margin: 1px 0 0 3px;
}

.im_peer_time {
  flex: none;
  margin-left: 5px;
  color: var(--text-steel-gray);
  font-size: 13px;
  margin-top: 1px;
}

.im_peer_message_wrap {
  display: flex;
  height: 20px;
  margin-top: 2px
}

.im_peer_message_wrap > div:first-child {
  display: flex;
  flex-grow: 1;
  margin-top: 2px;
}

.im_peer_message {
  color: var(--text-gray);
}

.im_peer_text_wrap div {
  display: inline;
  line-height: 18px;
}

.im_peer_author:not(:empty) {
  margin-right: 3px;
  color: var(--text-dark-steel-gray);
}

.im_peer_text.hasAttachment {
  color: var(--text-blue);
}

.im_peer_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}

/* Сервисное сообщение */
.im_peer_text span {
  color: var(--text-dark-steel-gray);
}

.im_peer_text span b {
  font-weight: 500;
}

.im_peer .message_dot {
  flex: none;
  margin: 8px 4px 0 4px;
  background: var(--background-steel-gray);
}

.im_peer_short_time {
  font-size: 13px;
  line-height: 18px;
  color: var(--text-steel-gray);
}

.im_peer_unread:not(:empty) {
  padding: 1px 6px 0 6px;
  margin: 1px 0 0 6px;
  border-radius: 10px;
  background: var(--background-blue);
  color: var(--background-blue-text);
  font-size: 12px;
  line-height: 18px;
  height: 19px;
}

.im_peer_unread:not(.outread).muted {
  background: var(--background-light-steel-gray);
}

.im_peer_unread.outread {
  flex: none;
  margin: 7px 4px 0 6px;
  width: 8px;
  height: 8px;
  border-radius: 10px;
  background: var(--background-blue-overlight);
}

.im_peer_mentioned {
  position: relative;
  bottom: -1px;
  margin: 0 2px 0 6px;
  border-radius: 10px;
  background: var(--background-blue);
}

.im_peer_mentioned + .im_peer_unread {
  margin-left: 3px;
}
</style>
