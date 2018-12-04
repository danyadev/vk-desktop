<template>
 <div class="message" :class="{ from_me: isOwner }">
   <img v-if="isFirstUserMsg" class="message_photo" :src="photo">
   <div v-else class="message_photo"></div>
   <div class="message_content">
     <div class="message_name">{{ name }}</div>
     <div class="message_text" v-emoji.color_push.br.link>{{ msg.text }}</div>
  </div>
 </div>
</template>

<script>
  const { loadProfile } = require('./methods');

  module.exports = {
    props: ['msg', 'peer_id'],
    computed: {
      isFirstUserMsg() {
        let dialog = this.$store.state.dialogs.find((dialog) => {
          return dialog.id == this.peer_id;
        });

        return true;
      },
      isOwner() {
        return this.msg.from == users.get().id;
      },
      user() {
        let user = this.$store.state.profiles[this.msg.from];
        if(!user) loadProfile(this.msg.from);

        return user || {};
      },
      photo() {
        return this.user.photo_50;
      },
      name() {
        let userName = this.user.id ? `${this.user.first_name} ${this.user.last_name}` : '...';

        return this.user.name || userName;
      }
    }
  }
</script>
