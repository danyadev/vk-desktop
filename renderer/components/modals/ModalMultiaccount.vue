<template>
  <div class="modal">
    <modal-header>{{ l('multiaccount_header') }}</modal-header>
    <div class="modal_content multiaccount">
      <div class="multiaccount_item" v-for="user in users" @click="setAccount(user.id)" :key="user.id">
        <img class="multiaccount_item_photo" :src="user.photo_100"/>
        <div class="multiaccount_item_data">
          <div class="multiaccount_item_name_wrap">
            <div class="multiaccount_item_name">{{ user.first_name }} {{ user.last_name }}</div>
            <img class="multiaccount_item_close" src="images/close.svg"
                 v-if="user.id != activeUser"
                 @click.stop="deleteUser(user.id)"/>
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
  const { getDate } = require('./../messages/methods');
  const { mapState } = Vuex;

  module.exports = {
    computed: {
      ...mapState('settings', ['users', 'activeUser'])
    },
    methods: {
      active(id) {
        if(this.activeUser == id) {
          return this.l('active_account');
        } else {
          let user = this.users[id];

          if(!user || !user.activeTime) {
            return this.l('was_active', [this.l('never')]);
          }

          let date = getDate(user.activeTime / 1000, {
            addTime: true,
            fullText: true
          });

          return this.l('was_active', [date]);
        }
      },
      setAccount(id) {
        if(this.activeUser == id) return;

        function setUser() {
          app.$store.commit('settings/updateUser', { id, activeTime: Date.now() });
          app.$store.commit('settings/setActiveUser', id);
        }

        if(this.activeUser) {
          this.$modals.open('confirm-set-account', {
            confirm() {
              setUser();
              getCurrentWindow().reload();
            }
          });
        } else setUser();
      },
      openAuth() {
        this.$modals.open('auth', { isModal: true });
      },
      deleteUser(id) {
        this.$store.commit('settings/removeUser', id);
      }
    }
  }
</script>
