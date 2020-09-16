<template>
  <div class="attach_fwd_msg">
    <div class="attach_fwd_msg_header">
      <img class="attach_fwd_msg_photo" :src="photo">
      <div class="attach_fwd_msg_info roboto-vk">
        <div class="attach_fwd_msg_name">{{ name }}</div>
        <div class="attach_fwd_msg_date">
          {{ date }}
          <template v-if="msg.editTime">
            <div class="attach_fwd_msg_dot"></div>
            {{ l('im_msg_edited') }}.
          </template>
        </div>
      </div>
    </div>

    <div class="attach_fwd_msg_content">
      <div v-if="msg.isContentDeleted" class="attach_fwd_msg_text isContentDeleted">
        {{ l('im_attachment_deleted') }}
      </div>
      <div v-else class="attach_fwd_msg_text roboto-vk">
        <VKText :inline="false" mention="link" link>{{ msg.text }}</VKText>
      </div>

      <Attachments :msg="msg" />

      <template v-if="msg.fwdCount || msg.hasReplyMsg">
        <div
          v-if="fwdDepth === 5 && !isCustomView"
          class="link"
          @click="openMessagesViewer"
        >
          {{ l('im_forwarded_some') }}
        </div>
        <Forwarded
          v-else
          :peer_id="peer_id"
          :msg="msg"
          :isCustomView="isCustomView"
          :fwdDepth="fwdDepth + 1"
        />
      </template>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { getPhoto, capitalize, loadProfile } from 'js/utils';
import { getPeerTitle } from 'js/messages';
import { getFullDate } from 'js/date';
import store from 'js/store';

import Attachments from './Attachments.vue';
import Forwarded from './Forwarded.vue';
import VKText from '../../../UI/VKText.vue';

export default {
  props: ['peer_id', 'msg', 'isCustomView', 'fwdDepth'],

  components: {
    Attachments,
    Forwarded,
    VKText
  },

  setup(props) {
    const state = reactive({
      user: computed(() => (
        store.state.profiles[props.msg.from] || (loadProfile(props.msg.from), null)
      )),
      name: computed(() => getPeerTitle(0, null, state.user)),
      photo: computed(() => getPhoto(state.user) || 'assets/blank.gif'),
      date: capitalize(getFullDate(new Date(props.msg.date * 1000)))
    });

    function openMessagesViewer() {
      store.commit('messages/openMessagesViewer', {
        messages: [props.msg],
        peer_id: props.peer_id
      });
    }

    return {
      ...toRefs(state),
      openMessagesViewer
    };
  }
};
</script>

<style>
.attach_forwarded .attach_fwd_msg:not(:first-child) {
  margin-top: 10px;
}

.attach_fwd_msg_header {
  display: flex;
  user-select: none;
}

.attach_fwd_msg_photo {
  border-radius: 50%;
  width: 35px;
  height: 35px;
  margin-right: 10px;
}

.attach_fwd_msg_info,
.attach_fwd_msg_name,
.attach_fwd_msg_date {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.attach_fwd_msg_info {
  font-size: 13px;
}

.attach_fwd_msg_name {
  color: var(--text-blue);
  font-weight: 500;
  margin-top: 2px;
}

.attach_fwd_msg_date {
  display: flex;
  color: var(--text-dark-steel-gray);
  margin-top: 1px;
}

.attach_fwd_msg_dot {
  width: 2px;
  height: 2px;
  margin: 8px 4px 0 4px;
  border-radius: 50%;
  background-color: var(--text-dark-steel-gray);
}

.attach_fwd_msg_content {
  margin-top: 5px;
}

.attach_fwd_msg_text.isContentDeleted {
  color: var(--text-dark-steel-gray);
}

.attach_fwd_msg_text + .im_attachments,
.attach_fwd_msg_text + .link,
.attach_fwd_msg_text + .attach_forwarded {
  margin-top: 5px;
}
</style>
