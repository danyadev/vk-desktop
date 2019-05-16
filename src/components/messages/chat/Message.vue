<template>
  <div class="message_container ff-roboto">
    <div v-if="messageDate" class="message_date">{{ messageDate }}</div>
    <div v-if="isStartUnreaded" class="message_unreaded_messages">
      <span>{{ l('im_unread_messages') }}</span>
    </div>

    <div :class="['message_wrap', { showUserData, serviceMessage, isPrevServiceMsg }]">
      <img class="message_photo" :src="photo">

      <div class="message">
        <div class="message_name">
          {{ name }}
          <div v-if="user && user.verified" class="verified"></div>
          <div class="message_time ff-roboto">{{ time }}</div>
        </div>
        <div v-if="serviceMessage" class="message_content" v-html="serviceMessage"></div>
        <div v-else class="message_content" v-emoji.push.br="msg.text"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import { isSameDay, differenceInMinutes } from 'date-fns';
  import { getTime, getMessageDate } from 'js/date';
  import { capitalize, getPhoto } from 'js/utils';
  import { getServiceMessage } from 'js/messages';

  export default {
    props: ['msg', 'peer_id', 'list'],
    data() {
      return {
        user_id: this.msg.from
      };
    },
    computed: {
      user() {
        return this.$store.state.profiles[this.user_id];
      },
      photo() {
        return this.user ? getPhoto(this.user) : 'assets/blank.gif';
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
        const index = this.list.findIndex(({ id }) => id == this.msg.id);

        return this.list[index - 1];
      },
      messageDate() {
        const prevMsgDate = this.prevMsg && new Date(this.prevMsg.date * 1000);
        const thisMsgDate = new Date(this.msg.date * 1000);

        if(!this.prevMsg || !isSameDay(prevMsgDate, thisMsgDate)) {
          return capitalize(getMessageDate(thisMsgDate));
        }
      },
      isStartUnreaded() {
        const in_read = this.peer && this.peer.in_read;
        const isPrevUnread = this.prevMsg && this.prevMsg.id > in_read;
        const isThisUnread = this.msg.id > in_read;

        return !this.msg.out && !isPrevUnread && isThisUnread;
      },
      serviceMessage() {
        return this.msg.action && getServiceMessage(this.msg.action, this.user, true);
      },
      isPrevServiceMsg() {
        return this.prevMsg && this.prevMsg.action;
      },
      showUserData() {
        const prevMsgDate = this.prevMsg && new Date(this.prevMsg.date * 1000);
        const thisMsgDate = new Date(this.msg.date * 1000);

        return !this.serviceMessage && (
          !this.prevMsg ||
          this.prevMsg.from != this.msg.from ||
          this.isPrevServiceMsg ||
          this.messageDate ||
          differenceInMinutes(thisMsgDate, prevMsgDate) > 10
        );
      }
    },
    methods: {

    }
  }
</script>

<style scoped>
  .message_container {
    display: flex;
    flex-direction: column;
    flex: none;
  }

  .message_date, .message_unreaded_messages {
    text-align: center;
    margin: 20px 0 0 0;
    color: #5d6165;
  }

  .message_unreaded_messages {
    position: relative;
  }

  .message_unreaded_messages span {
    position: relative;
    background-color: #fff;
    padding: 10px;
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
    display: flex;
    margin: 20px 20px 0 20px;
  }

  .message_wrap:not(.showUserData) {
    margin: 10px 20px 0 70px;
  }

  .message_wrap.serviceMessage {
    /* Центровка текста в списке сообщений */
    justify-content: center;
    /* Центровка текста в сервисном сообщении, когда он не помещается в 1 строку */
    text-align: center;
    color: #5d6165;
    margin-left: 20px;
  }

  .message_wrap.serviceMessage:not(.isPrevServiceMsg) {
    margin-top: 15px;
  }

  .message_date + .message_wrap.serviceMessage {
    margin-top: 20px;
  }

  .message_content >>> b {
    font-weight: 500;
  }

  .message_wrap:not(.showUserData) .message_photo,
  .message_wrap:not(.showUserData) .message_name { display: none }

  .message_photo {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    margin-right: 10px;
    flex: none;
  }

  .message_name {
    color: #254f79;
    font-family: BlinkMacSystemFont, Segoe UI;
    font-weight: 500;
  }

  .message_name .verified {
    margin-top: -1px;
  }

  .message_time {
    display: inline;
    margin-left: 2px;
    font-weight: 400;
    font-size: 13px;
    color: #6c737a;
  }

  .message_content {
    line-height: 20px;
    margin-top: 2px;
    word-break: break-word;
  }
</style>
