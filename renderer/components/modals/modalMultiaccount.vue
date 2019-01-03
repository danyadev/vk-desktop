<template>
  <div class="modal">
    <modal-header>{{ l('multiaccount_header') }}</modal-header>
    <div class="modal_content multiaccount">
      <div class="multiaccount_item" v-for="user in users" @click="setAccount(user.id)" :key="user.id">
        <img class="multiaccount_item_photo" :src="user.photo_50">
        <div class="multiaccount_item_data">
          <div class="multiaccount_item_name_wrap">
            <div class="multiaccount_item_name">{{ user.first_name }} {{ user.last_name }}</div>
            <img class="multiaccount_item_close"
                 v-show="$store.state.activeUser != user.id"
                 src="images/close.svg"
                 @click.stop="deleteUser(user.id)">
          </div>
          <div class="multiaccount_item_descr">{{ active(user.id) }}</div>
        </div>
      </div>
    </div>
    <div class="modal_bottom">
      <button class="button right" @click="openAuth">{{ l('add_account') }}</button>
    </div>
  </div>
</template>

<script>
  const { getDate } = require('./../messages/messages');

  module.exports = {
    computed: {
      users() {
        return this.$store.state.users;
      }
    },
    methods: {
      active(id) {
        if(this.$store.state.activeUser == id) {
          return this.l('active_account');
        } else {
          let user = this.$store.state.users[id];

          if(!user || !user.activeTime) {
            return this.l('was_active', null, [this.l('never')]);
          }

          let date = getDate(user.activeTime, {
            addTime: true,
            fullText: true
          });

          return this.l('was_active', null, [date]);
        }
      },
      setAccount(id) {
        if(this.$store.state.activeUser != id) {
          this.$store.commit('updateUser', {
            id: id,
            activeTime: Date.now() / 1000
          });

          this.$store.commit('setActiveUser', id);
        }
      },
      openAuth() {
        this.$modals.open('auth', { isModal: true });
      },
      deleteUser(id) {
        this.$store.commit('removeUser', id);
      }
    }
  }
</script>
