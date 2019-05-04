<template>
  <div :class="['message_wrap', { showUserData, serviceMessage, isPrevServiceMsg }]">
    <img class="message_photo" :src="photo">

    <div class="message">
      <div class="message_name">
        {{ name }}
        <div v-if="user && user.verified" class="verified"></div>
        <div class="message_time">{{ time }}</div>
      </div>
      <div v-if="serviceMessage" class="message_content" v-html="serviceMessage"></div>
      <div v-else class="message_content" v-emoji.push.br="msg.text"></div>
    </div>
  </div>
</template>

<script>
  import { getTime } from 'js/date';
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
        return this.user ? this.user.photo : 'assets/blank.gif';
      },
      name() {
        return this.user
          ? this.user.name || `${this.user.first_name} ${this.user.last_name}`
          : '...';
      },
      time() {
        return getTime(new Date(this.msg.date * 1000));
      },

      prevMsg() {
        const index = this.list.findIndex(({ id }) => id == this.msg.id);

        return this.list[index - 1];
      },
      serviceMessage() {
        return this.msg.action && getServiceMessage(this.msg.action, this.user, true);
      },
      isPrevServiceMsg() {
        return this.prevMsg && this.prevMsg.action;
      },
      showUserData() {
        return !this.serviceMessage && (
          !this.prevMsg ||
          this.prevMsg.from != this.msg.from ||
          this.isPrevServiceMsg
        );
      }
    },
    methods: {

    }
  }
</script>

<style scoped>
  .message_wrap {
    display: flex;
    flex: none;
    margin: 20px 20px 0 20px;
  }

  .message_wrap:not(.showUserData) {
    margin: 10px 20px 0 70px;
  }

  .message_wrap.serviceMessage {
    /* Центровка текста в сервисном сообщении, когда он не помещается в 1 строку */
    text-align: center;
    /* Центровка текста в списке сообщений */
    justify-content: center;
    color: #4e4f50;
    margin-left: 20px;
  }

  .message_wrap.serviceMessage:not(.isPrevServiceMsg) {
    margin-top: 15px;
  }

  .message_content >>> b {
    font-weight: 500;
  }

  .message_wrap:not(.showUserData) .message_photo { display: none }
  .message_photo {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    margin-right: 10px;
    flex: none;
  }

  .message_wrap:not(.showUserData) .message_name { display: none }
  .message_name {
    color: #254f79;
    font-weight: 500;
  }

  .message_name .verified {
    margin-top: -1px;
  }

  .message_time {
    display: inline;
    margin-left: 2px;
    font-family: Roboto;
    font-weight: 400;
    font-size: 13px;
    color: #6c737a;
  }

  .message_content {
    font-family: Roboto;
    line-height: 20px;
    margin-top: 2px;
    word-break: break-word;
  }
</style>
