<template>
  <div v-if="!isHidden" class="im_pinned_msg_wrap" @click="open">
    <Icon name="pin" color="var(--text-secondary)" class="im_pinned_msg_icon" />

    <div class="im_pinned_msg">
      <div class="im_pinned_msg_name_wrap text-overflow">
        <div class="im_pinned_msg_name">{{ name }}</div>
        <div class="im_pinned_msg_time">{{ time }}</div>
      </div>
      <div :class="['im_pinned_msg_text text-overflow', { isAttachment }]" v-emoji.push="text"></div>
    </div>

    <Icon name="close" color="var(--im-pinned-icon)" class="im_pinned_msg_close" @click.stop="hide" />
  </div>
</template>

<script>
  import { eventBus } from 'js/utils';
  import { getMessagePreview } from 'js/messages';
  import { getFullMessageDate } from 'js/date';
  import Icon from '../../UI/Icon.vue';

  export default {
    props: ['msg', 'peer_id'],

    components: {
      Icon
    },

    computed: {
      isHidden() {
        return this.$store.getters['settings/settings'].hiddenPinnedMessages[this.peer_id];
      },
      user() {
        return this.$store.state.profiles[this.msg.from];
      },
      name() {
        return this.user ? this.user.name || `${this.user.first_name} ${this.user.last_name}` : '...';
      },
      time() {
        return getFullMessageDate(new Date(this.msg.date * 1000));
      },
      text() {
        return getMessagePreview(this.msg, this.peer_id);
      },
      isAttachment() {
        return this.msg.hasAttachment && !this.msg.text && !this.msg.action;
      }
    },

    methods: {
      open() {
        if(this.msg.id) {
          eventBus.emit('messages:event', 'jump', {
            peer_id: this.peer_id,
            msg_id: this.msg.id
          });
        } else {
          this.$modals.open('messages-viewer', {
            peer_id: this.peer_id,
            messages: [this.msg]
          });
        }
      },

      hide() {
        const list = { ...this.$store.getters['settings/settings'].hiddenPinnedMessages };

        list[this.peer_id] = true;

        this.$store.commit('settings/updateMessagesSettings', {
          key: 'hiddenPinnedMessages',
          value: list
        });
      }
    }
  }
</script>

<style>
  .im_pinned_msg_wrap {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 52px;
    border-bottom: 1px solid var(--input-border);
    background: var(--background-content);
    cursor: pointer;
  }

  .im_pinned_msg_wrap::after {
    content: '';
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    z-index: 1;
    height: 4px;
    margin-top: 1px;
    pointer-events: none;
    background: linear-gradient(0, transparent, rgba(0, 0, 0, .03) 75%, rgba(0, 0, 0, .06));
  }

  .im_pinned_msg_icon {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0 20px;
  }

  .im_pinned_msg {
    flex-grow: 1;
    width: calc(100% - 60px - 56px);
  }

  .im_pinned_msg_name {
    display: inline;
    color: var(--im-pinned-name);
    font-weight: 500;
  }

  .im_pinned_msg_time {
    display: inline;
    margin-left: 2px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .im_pinned_msg_name_wrap,
  .im_pinned_msg_text {
    color: var(--im-pinned-text);
  }

  .im_pinned_msg_text.isAttachment {
    color: var(--text-secondary); /* в тёмной теме не имеет смысла */
  }

  .im_pinned_msg_close {
    box-sizing: content-box;
    flex: none;
    width: 16px;
    height: 16px;
    padding: 16px 20px;
    opacity: .7;
    transition: opacity .3s;
  }

  .im_pinned_msg_close:hover {
    opacity: 1;
  }
</style>
