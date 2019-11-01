<template>
  <div class="message_container">
    <div v-if="messageDate" class="message_date">{{ messageDate }}</div>
    <div v-if="isStartUnreaded" class="message_unreaded_messages">
      <span>{{ l('im_unread_messages') }}</span>
    </div>

    <div :class="['message_wrap', { showUserData, serviceMessage, isUnreaded, out }]">
      <div v-if="showUserData" class="message_name">
        {{ name }}
        <div v-if="user && user.verified" class="verified"></div>
      </div>

      <div class="message">
        <img v-if="showUserData" class="message_photo" :src="photo">
        <div v-else-if="isChat && !serviceMessage && !out && !isChannel" class="message_photo"></div>

        <div class="message_bubble">
          <div v-if="serviceMessage" v-html="serviceMessage"></div>
          <div v-else v-emoji.push.br="msg.text"></div>

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
  </div>
</template>

<script>
  import { isSameDay } from 'date-fns';
  import { getTime, getMessageDate } from 'js/date';
  import { capitalize, getPhoto } from 'js/utils';
  import { getServiceMessage } from 'js/messages';

  export default {
    props: ['msg', 'peer_id', 'list'],
    computed: {
      user() {
        return this.$store.state.profiles[this.msg.from];
      },
      photo() {
        return getPhoto(this.user) || 'assets/blank.gif';
      },
      out() {
        // Только для использования в css
        return this.msg.out && !this.serviceMessage;
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
      peer() {
        const conv = this.$store.state.messages.conversations[this.peer_id];

        return conv && conv.peer;
      },
      prevMsg() {
        return this.list[this.list.indexOf(this.msg) - 1];
      },
      messageDate() {
        const prevMsgDate = this.prevMsg && new Date(this.prevMsg.date * 1000);
        const thisMsgDate = new Date(this.msg.date * 1000);

        if(!this.prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
          return capitalize(getMessageDate(thisMsgDate));
        }
      },
      isStartUnreaded() {
        const in_read = this.peer && (this.peer.new_in_read || this.peer.in_read);
        const isPrevUnread = this.prevMsg && this.prevMsg.id > in_read;
        const isThisUnread = this.msg.id > in_read;

        return !this.msg.out && !isPrevUnread && isThisUnread;
      },
      isUnreaded() {
        return this.peer && (
          this.msg.id > this.peer.out_read || // непрочитано собеседником
          this.msg.id > this.peer.in_read // непрочитано мной
        );
      },
      serviceMessage() {
        if(this.msg.action) {
          return getServiceMessage(this.msg.action, this.user || { id: this.msg.from }, true);
        }
      },
      showUserData() {
        const prevMsgDate = this.prevMsg && new Date(this.prevMsg.date * 1000);
        const thisMsgDate = new Date(this.msg.date * 1000);

        return !this.msg.action && !this.msg.out && this.isChat && !this.isChannel && (
          !this.prevMsg ||
          this.prevMsg.from != this.msg.from ||
          this.prevMsg.action ||
          this.isStartUnreaded ||
          this.messageDate
        );
      }
    }
  }
</script>

<style scoped>
  .message_container {
    flex-direction: column;
  }

  .message_date, .message_unreaded_messages {
    text-align: center;
    margin: 10px 0 8px 0;
    color: #5d6165;
  }

  .message_unreaded_messages {
    position: relative;
  }

  .message_unreaded_messages span {
    position: relative;
    background: #fff;
    padding: 0 10px;
  }

  .message_unreaded_messages::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    height: 1px;
    width: 100%;
    background: #d4d6da;
  }

  .message_wrap {
    padding: 8px 14px 6px 14px;
  }

  .message_wrap:not(.showUserData):not(.serviceMessage) {
    padding: 3px 14px 5px 14px;
  }

  .message_wrap.serviceMessage {
    display: flex;
    justify-content: center;
    text-align: center;
    color: #5d6165;
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

  .message_wrap:not(.serviceMessage) .message_bubble {
    max-width: 75%;
    background-color: #dfe6ea;
    padding: 8px 12px;
    border-radius: 18px;
    word-break: break-word;
  }

  .message_wrap.out .message_bubble {
    background-color: #c7dff9;
  }

  .message_bubble * {
    display: inline;
  }

  .message_bubble >>> b {
    font-weight: 500;
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

  .message_wrap.serviceMessage .message_time_wrap {
    display: none;
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
</style>
