<template>
 <div class="message" :id="'message' + this.msg.id" :class="{ from_me: isOwner }">
   <img v-if="showUserData" class="message_photo" :src="photo">
   <div v-else-if="isChat && !peer.channel" class="message_photo"></div>
   <div class="message_content" :class="{ outread }">
     <div class="message_name" v-if="showUserData">{{ name }}</div>
     <div class="message_text" v-emoji.color_push.br.link>{{ msg.text }}</div>
  </div>
 </div>
</template>

<script>
  const { loadProfile } = require('./methods');

  module.exports = {
    props: {
      msg: {
        type: Object,
        required: true
      },
      peer: {
        type: Object,
        required: true
      }
    },
    computed: {
      isChat() {
        return this.peer.id > 2e9;
      },
      showUserData() {
        if(!this.isChat || this.peer.channel) return false;

        return true;
      },
      isOwner() {
        return this.msg.from == users.get().id;
      },
      user() {
        let user = this.$store.state.profiles[this.msg.from];
        if(!user || !user.photo_50) loadProfile(this.msg.from);

        return user || {};
      },
      photo() {
        return this.user.photo_50;
      },
      name() {
        let userName = this.user.photo_50 ? `${this.user.first_name} ${this.user.last_name}` : '...';

        return this.user.name || userName;
      },
      outread() {
        return this.msg.outread;
      }
    }
  }
</script>
