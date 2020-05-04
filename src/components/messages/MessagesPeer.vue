<template>
  <Ripple
    color="var(--messages-peer-ripple)"
    class="im_peer"
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
          <Icon v-if="peer.muted" name="muted" color="var(--icon-gray)" class="im_peer_muted" />
        </div>
        <div class="im_peer_time">{{ time }}</div>
      </div>

      <div class="im_peer_message_wrap">
        <Typing v-if="hasTyping && !fromSearch" :peer_id="peer.id" />
        <div v-else-if="msg.id" class="im_peer_message">
          <div class="im_peer_author">{{ authorName }}</div>
          <div v-if="msg.isContentDeleted" :key="msg.id" class="im_peer_text isContentDeleted">
            {{ l('im_attachment_deleted') }}
          </div>
          <div v-else :key="msg.id" :class="['im_peer_text', { isAttachment }]">
            <ServiceMessage
              v-if="msg.action"
              :msg="msg"
              :author="author"
              :peer_id="peer.id"
            />
            <VKText v-else mention>{{ message }}</VKText>
          </div>
        </div>
        <div v-else class="im_peer_text isContentDeleted">
          {{ l('im_no_messages') }}
        </div>

        <div v-if="peer.mentions.length && !fromSearch" class="im_peer_mentioned">
          <Icon name="mention" color="var(--blue-background-text)" width="20" height="18" />
        </div>

        <div
          v-if="!fromSearch"
          :class="['im_peer_unread', { outread, muted: peer.muted }]"
          :title="peer.unread || ''"
        >
          {{ convertCount(peer.unread || '') }}
        </div>
      </div>
    </div>
  </Ripple>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { getMessagePreview, loadConversationMembers, getPeerAvatar, getPeerTitle } from 'js/messages';
import { convertCount, eventBus } from 'js/utils';
import { getShortDate } from 'js/date';
import getTranslate from 'js/getTranslate';
import store from 'js/store';
import router from 'js/router';

import Ripple from '../UI/Ripple.vue';
import Icon from '../UI/Icon.vue';
import VKText from '../UI/VKText.vue';
import Typing from './Typing.vue';
import ServiceMessage from './ServiceMessage.vue';

export default {
  props: ['peer', 'msg', 'activeChat', 'fromSearch'],

  components: {
    Ripple,
    Icon,
    VKText,
    Typing,
    ServiceMessage
  },

  setup(props) {
    const state = reactive({
      isChat: props.peer.id > 2e9,
      profiles: computed(() => store.state.profiles),
      owner: computed(() => state.profiles[props.peer.id]),
      author: computed(() => state.profiles[props.msg.from]),
      blueName: computed(() => [100, 101, 333].includes(Number(props.peer.id))),
      message: computed(() => getMessagePreview(props.msg)),
      isAttachment: computed(() => !props.msg.text && !props.msg.action && props.msg.hasAttachment),
      outread: computed(() => props.peer.out_read !== props.peer.last_msg_id),
      photo: computed(() => getPeerAvatar(props.peer.id, props.peer, state.owner)),
      chatName: computed(() => getPeerTitle(props.peer.id, props.peer, state.owner)),

      online: computed(() => {
        if (state.owner && state.owner.online) {
          return state.owner.online_mobile ? 'mobile' : 'desktop';
        }
      }),

      time: computed(() => {
        // Даты может не быть если нет сообщения и беседа закреплена
        if (props.msg.date) {
          return getShortDate(new Date(props.msg.date * 1000));
        }
      }),

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

    function openChat() {
      if (props.activeChat === props.peer.id) {
        return eventBus.emit('messages:event', 'jump', {
          peer_id: props.activeChat,
          bottom: true
        });
      }

      if (props.activeChat) {
        eventBus.emit('messages:event', 'closeChat', {
          peer_id: props.activeChat
        });
      }

      router.replace(`/messages/${props.peer.id}`);
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
  transition: background-color .3s;
}

.im_peer:hover {
  background: var(--messages-peer-hover);
  cursor: pointer;
}

.im_peer_photo {
  position: relative;
  width: 50px;
  height: 50px;
  margin: 10px 10px 10px 16px;
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
  width: calc(100% - 76px);
  padding: 10px 16px 10px 0;
}

.im_peer:not(:last-child) .im_peer_content {
  border-bottom: 1px solid var(--separator);
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
  margin: 2px 0 0 4px;
}

.im_peer_muted {
  flex: none;
  width: 13px;
  height: 13px;
  margin: 3px 0 0 3px;
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
  flex-grow: 1;
  margin-top: 2px;
}

.im_peer_message {
  color: var(--text-gray);
}

.im_peer_author:not(:empty) {
  display: inline;
  margin-right: 3px;
  color: var(--text-dark-steel-gray);
}

.im_peer_text {
  display: inline;
}

.im_peer_text b {
  font-weight: 500;
}

.im_peer_text.isAttachment {
  color: var(--text-blue);
}

.im_peer_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}

.im_peer_unread:not(:empty) {
  padding: 1px 6px 0 6px;
  margin: 1px 0 0 3px;
  border-radius: 10px;
  background: var(--blue-background);
  color: var(--blue-background-text);
  font-size: 12px;
  line-height: 18px;
  height: 19px;
}

.im_peer_unread:not(.outread).muted {
  background: var(--steel-gray-background-light);
}

.im_peer_unread.outread {
  flex: none;
  margin: 7px 4px 0 4px;
  width: 8px;
  height: 8px;
  border-radius: 10px;
  background: var(--blue-background-overlight);
}

.im_peer_mentioned {
  position: relative;
  bottom: -1px;
  margin: 0 2px;
  border-radius: 10px;
  background: var(--blue-background);
}
</style>
