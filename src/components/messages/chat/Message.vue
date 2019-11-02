<template>
  <div :class="['message_wrap', { showUserData, isUnread, out: msg.out, isLoading: msg.isLoading }]">
    <div v-if="showUserData" class="message_name">
      {{ name }}
      <div v-if="user && user.verified" class="verified"></div>
    </div>

    <div class="message">
      <img v-if="showUserData" class="message_photo" :src="photo">
      <div v-else-if="isChat && !msg.out && !isChannel" class="message_photo"></div>

      <div class="message_bubble">
        <div v-emoji.push.br="msg.text" class="message_text"></div>

        <div class="message_time_wrap">
          <template v-if="msg.editTime">
            <div class="message_edited">{{ l('im_msg_edited') }}</div>
            <div class="dot"></div>
          </template>

          <div class="message_time">{{ time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getTime } from 'js/date';
  import { getPhoto } from 'js/utils';

  export default {
    props: ['msg', 'peer', 'peer_id', 'messageDate', 'isStartUnread', 'prevMsg'],
    computed: {
      user() {
        return this.$store.state.profiles[this.msg.from];
      },
      photo() {
        return getPhoto(this.user) || 'assets/blank.gif';
      },
      isChat() {
        return this.peer_id > 2e9;
      },
      isChannel() {
        return this.peer && this.peer.channel;
      },
      name() {
        return this.user
          ? this.user.name || `${this.user.first_name} ${this.user.last_name}`
          : '...';
      },
      time() {
        return getTime(new Date(this.msg.date * 1000));
      },
      isUnread() {
        return this.peer && (
          this.msg.id > this.peer.out_read || // непрочитано собеседником
          this.msg.id > this.peer.in_read // непрочитано мной
        );
      },
      showUserData() {
        return !this.msg.out && this.isChat && !this.isChannel && (
          !this.prevMsg ||
          this.prevMsg.from != this.msg.from ||
          this.prevMsg.action ||
          this.isStartUnread ||
          this.messageDate
        );
      }
    }
  }
</script>

<style scoped>
  .message_wrap {
    padding: 8px 14px 4px 14px;
  }

  .message_wrap:not(.showUserData) {
    padding: 4px 14px;
  }

  .message_name {
    color: #254f79;
    font-weight: 500;
    margin-left: 50px;
    margin-bottom: 2px;
  }

  .message_name .verified {
    margin-top: -1px;
  }

  .message {
    display: flex;
  }

  .message_wrap.out .message {
    justify-content: flex-end;
  }

  .message_photo {
    border-radius: 50%;
    width: 35px;
    height: 35px;
    margin-right: 10px;
  }

  .message_bubble {
    position: relative;
    max-width: 75%;
    background-color: #dfe6ea;
    padding: 8px 12px;
    border-radius: 18px;
    word-break: break-word;
  }

  .message_wrap.out .message_bubble {
    background-color: #c7dff9;
  }

  .message_text {
    display: inline;
  }

  .message_time_wrap {
    position: relative;
    bottom: -4px;
    display: flex;
    float: right;
    color: #696969;
    font-weight: 500;
    font-size: 11px;
    margin: 6px 0 0 6px;
    pointer-events: none;
  }

  .message_edited {
    margin-top: -1px;
  }

  .dot {
    width: 2px;
    height: 2px;
    margin: 6px 3px 0 3px;
    border-radius: 50%;
    background-color: #696969;
  }

  .message_wrap.isUnread .message_bubble::before,
  .message_wrap.isUnread .message_bubble::after {
    position: absolute;
    width: 8px;
    height: 8px;
    bottom: 12px;
    border-radius: 50%;
    background-color: #93adc8;
  }

  .message_wrap:not(.isLoading).isUnread.out .message_bubble::before {
    content: '';
    left: -15px;
  }

  .message_wrap.isUnread:not(.out) .message_bubble::after {
    content: '';
    right: -15px;
  }

  .message_wrap.isLoading .message_bubble::before {
    content: '';
    width: 18px;
    height: 18px;
    left: -20px;
    bottom: 7px;
    background: url(~assets/recent.svg) center / contain;
  }
</style>
