<template>
  <div class="attach_fwd_msg">
    <div class="attach_fwd_msg_header">
      <img class="attach_fwd_msg_photo" :src="photo">
      <div class="attach_fwd_msg_info text-overflow">
        <div class="attach_fwd_msg_name text-overflow">{{ name }}</div>
        <div class="attach_fwd_msg_date text-overflow">
          {{ date }}
          <template v-if="msg.editTime">
            <div class="attach_fwd_msg_dot"></div>
            {{ l('im_msg_edited') }}.
          </template>
        </div>
      </div>
    </div>
    <div class="attach_fwd_msg_content">
      <Reply v-if="msg.isReplyMsg" :msg="msg" :peer_id="peer_id" :isFwdMsg="true" />

      <div v-if="msg.isContentDeleted" class="attach_fwd_msg_text isContentDeleted">{{ l('im_attachment_deleted') }}</div>
      <div v-else class="attach_fwd_msg_text" v-emoji.push.br="msg.text"></div>

      <Attachments :msg="msg" :peer_id="peer_id" :fwdDepth="fwdDepth" />
      <div v-if="msg.fwdCount && fwdDepth == 5 && !isModal" class="link" @click="openMessagesViewer">
        {{ l('im_forwarded_some') }}
      </div>
      <Forwarded v-else-if="msg.fwdCount" :peer_id="peer_id" :msg="msg" :fwdDepth="fwdDepth+1" />
    </div>
  </div>
</template>

<script>
  import { getPhoto, capitalize, loadProfile } from 'js/utils';
  import { getFullMessageDate } from 'js/date';

  import Reply from './Reply.vue';
  import Attachments from './Attachments.vue';

  export default {
    props: ['peer_id', 'messages', 'msg', 'fwdDepth'],

    components: {
      Reply,
      Attachments
    },

    data: () => ({
      isModal: false
    }),

    computed: {
      user() {
        return this.$store.state.profiles[this.msg.from] || (loadProfile(this.msg.from), null);
      },
      name() {
        return this.user
          ? this.user.name || `${this.user.first_name} ${this.user.last_name}`
          : '...';
      },
      photo() {
        return getPhoto(this.user) || 'assets/blank.gif';
      },
      date() {
        return capitalize(getFullMessageDate(this.msg.date * 1000));
      }
    },

    methods: {
      openMessagesViewer() {
        this.$modals.open('messages-viewer', {
          peer_id: this.peer_id,
          messages: this.messages
        });
      }
    },

    mounted() {
      this.isModal = this.$el.closest('.modal');
    }
  }
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
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }

  .attach_fwd_msg_name {
    color: #254f79;
    font-weight: 500;
    margin-top: 2px;
  }

  .attach_fwd_msg_date {
    display: flex;
    color: #3e4854;
    margin-top: 1px;
  }

  .attach_fwd_msg_dot {
    width: 2px;
    height: 2px;
    margin: 8px 4px 0 4px;
    border-radius: 50%;
    background-color: #3e4854;
  }

  .attach_fwd_msg_content {
    margin-top: 5px;
  }

  .attach_fwd_msg_text.isContentDeleted {
    color: #696969;
  }

  .attach_fwd_msg_text + .im_attachments,
  .attach_fwd_msg_text + .link,
  .attach_fwd_msg_text + .attach_forwarded {
    margin-top: 5px;
  }

  .attach_fwd_msg .link {
    color: #0e4788;
  }
</style>
