<template>
  <div class="message_wrap">
    <img class="message_photo" :src="photo">

    <div class="message">
      <div class="message_name">
        {{ name }}
        <div v-if="user && user.verified" class="verified"></div>
      </div>
      <div class="message_content" v-emoji.push.br="msg.text"></div>
    </div>
  </div>
</template>

<script>
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
    margin: 0 20px 20px 20px;
  }

  .message_photo {
    border-radius: 50%;
    width: 40px;
    height: 40px;
    margin-right: 10px;
    flex: none;
  }

  .message_name {
    color: #254f79;
    font-weight: 500;
  }

  .message_name .verified {
    margin-top: -1px;
  }

  .message_content {
    font-family: Roboto;
    line-height: 20px;
    margin-top: 2px;
    word-break: break-word;
  }
</style>
