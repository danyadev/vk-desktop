<template>
  <div class="header_wrap border-bottom-shadow">
    <div class="header">
      <template v-if="!selectedMessages.length">
        <Icon
          name="im_back"
          color="var(--icon-blue)"
          width="24"
          height="26"
          class="im_header_back"
          @click="$emit('close')"
        />
        <img class="im_header_photo" :src="photo">

        <div class="im_header_center text-overflow">
          <div class="im_header_name_wrap">
            <div class="im_header_name text-overflow">
              <VKText>{{ title }}</VKText>
            </div>
            <Icon v-if="owner && owner.verified" name="verified" class="verified white" />
            <Icon
              v-if="peer && peer.isCasperChat"
              name="ghost"
              color="var(--icon-blue)"
              class="im_header_ghost"
            />
            <Icon
              v-if="peer && peer.muted"
              name="muted"
              color="var(--icon-gray)"
              class="im_header_muted"
            />
          </div>

          <Typing v-if="hasTyping" :peer_id="peer_id" :isChat="true" />
          <div v-else class="im_header_online text-overflow">{{ online }}</div>
        </div>

        <Icon
          name="search"
          color="var(--icon-blue)"
          class="header_btn"
          @click="$emit('search')"
        />
        <MessagesChatMenu :peer_id="peer_id" :peer="peer" />
      </template>

      <template v-else>
        <Icon
          name="cancel"
          color="var(--icon-blue)"
          width="26"
          height="26"
          class="im_header_cancel_select"
          @click="cancelSelect"
        />

        <div class="im_header_selected_count">
          {{ l('im_selected_messages_count', [selectedMessages.length], selectedMessages.length) }}
        </div>

        <div class="im_header_selected_actions">
          <Icon
            v-if="
              selectedMessages.length && peer.isWriteAllowed && (
                !peer.isCasperChat || selectedMessages.length === 1
              )
            "
            name="reply"
            color="var(--icon-blue)"
            :data-tooltip="
              selectedMessages.length === 1 ? 'im_reply_msg' : 'im_forward_messages_here'
            "
            @click="reply"
          />

          <Icon
            v-if="peer && !peer.isChannel"
            name="trash"
            color="var(--icon-blue)"
            :data-tooltip="selectedMessages.length === 1 ? 'im_delete_msg' : 'im_delete_messages'"
            @click="deleteMessages(selectedMessages, peer, true)"
          />

          <Icon
            v-if="selectedMessages.length && !peer.isCasperChat"
            name="forward"
            color="var(--icon-blue)"
            :data-tooltip="
              selectedMessages.length === 1 ? 'im_forward_message' : 'im_forward_messages'
            "
            @click="forward()"
          />

          <Icon
            name="spam"
            color="var(--icon-blue)"
            data-tooltip="im_mark_msg_as_spam"
            @click="markAsSpam"
          />
        </div>
      </template>
    </div>

    <PinnedMessage v-if="peer && peer.pinnedMsg" :msg="peer.pinnedMsg" :peer_id="peer_id" />
  </div>
</template>

<script>
import { reactive, computed, toRefs, nextTick } from 'vue';
import { eventBus } from 'js/utils';
import {
  getPeerAvatar,
  getPeerTitle,
  getPeerOnline,
  getMessageById,
  deleteMessages
} from 'js/messages';
import store from 'js/store';
import vkapi from 'js/vkapi';
import router from 'js/router';

import Icon from '../../UI/Icon.vue';
import VKText from '../../UI/VKText.vue';
import MessagesChatMenu from '../../ActionMenus/MessagesChatMenu.vue';
import PinnedMessage from './PinnedMessage.vue';
import Typing from '../Typing.vue';

export default {
  props: ['peer_id', 'peer'],

  components: {
    Icon,
    VKText,
    MessagesChatMenu,
    PinnedMessage,
    Typing
  },

  setup(props) {
    const state = reactive({
      owner: computed(() => store.state.profiles[props.peer_id]),
      photo: computed(() => getPeerAvatar(props.peer_id, props.peer, state.owner)),
      title: computed(() => getPeerTitle(props.peer_id, props.peer, state.owner)),
      online: computed(() => getPeerOnline(props.peer_id, props.peer, state.owner)),
      selectedMessages: computed(() => store.state.messages.selectedMessages),

      hasTyping: computed(() => {
        const typing = store.state.messages.typing[props.peer_id] || {};
        return !!Object.keys(typing).length;
      })
    });

    function cancelSelect() {
      store.commit('messages/removeSelectedMessages');
    }

    function scrollToEnd() {
      eventBus.emit('messages:event', 'jump', {
        peer_id: props.peer_id,
        bottom: true
      });
    }

    function forward(toThisChat) {
      if (toThisChat) {
        eventBus.emit('messages:replyOrForward', {
          type: 'forward',
          data: state.selectedMessages.map((id) => getMessageById(id, props.peer_id))
        });

        nextTick().then(scrollToEnd);
      } else {
        store.state.messages.tmpForwardingMessages = state.selectedMessages.map(
          (id) => getMessageById(id, props.peer_id)
        );

        eventBus.emit('messages:event', 'closeChat', {
          peer_id: props.peer_id
        });

        router.replace({
          name: 'forward-to',
          params: {
            fromId: props.peer_id
          }
        });
      }

      cancelSelect();
    }

    async function reply() {
      if (state.selectedMessages.length > 1) {
        return forward(true);
      }

      eventBus.emit('messages:replyOrForward', {
        type: 'reply',
        data: getMessageById(state.selectedMessages[0], props.peer_id)
      });

      cancelSelect();
      await nextTick();
      scrollToEnd();
    }

    function markAsSpam() {
      vkapi('messages.delete', {
        message_ids: state.selectedMessages.join(','),
        spam: 1
      });

      cancelSelect();
    }

    return {
      ...toRefs(state),

      cancelSelect,
      forward,
      reply,
      deleteMessages,
      markAsSpam
    };
  }
};
</script>

<style>
.header_wrap {
  position: relative;
  border-bottom: 1px solid var(--separator);
}

.im_chat_container .header {
  padding-left: 15px;
}

.im_header_back {
  display: none;
  margin: 0 6px 0 -6px;
}

.im_header_cancel_select,
.im_header_selected_actions svg {
  cursor: pointer;
  opacity: .7;
  transition: opacity .3s;
}

.im_header_cancel_select:hover,
.im_header_selected_actions svg:hover {
  opacity: 1;
}

.im_header_photo {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  margin-right: 10px;
}

.im_header_center {
  flex-grow: 1;
}

.im_header_name_wrap {
  display: flex;
  height: 16px;
}

.im_header_name_wrap .verified {
  flex: none;
  margin: 0 0 0 4px;
}

.im_header_ghost {
  opacity: .7;
  margin: -1px 0 0 3px;
}

.im_header_muted {
  opacity: .7;
  width: 14px;
  height: 16px;
  margin-left: 3px;
}

.im_header_name {
  line-height: 14px;
}

.im_header_online:not(:empty) {
  color: var(--text-dark-steel-gray);
  font-size: 13px;
  margin-top: 2px;
}

.im_header_cancel_select {
  margin: 0 10px;
}

.im_header_selected_actions {
  margin: 0 3px 0 auto;
}

.im_header_selected_actions svg {
  margin-right: 15px;
}
</style>
