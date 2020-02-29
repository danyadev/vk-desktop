<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_multiacc_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="item" v-for="user in users" :key="user.id" @click="setAccount(user.id)">
        <img class="item_photo" :src="user.photo_100">
        <div class="item_data">
          <div class="item_name_wrap">
            <div class="item_name">{{ user.first_name }} {{ user.last_name }}</div>
            <img v-if="user.id != activeUser"
                 class="item_close"
                 src="~assets/close.svg"
                 @click.stop="removeAccount(user.id)"
            >
          </div>
          <div class="item_description">{{ getUserDescription(user) }}</div>
        </div>
      </div>
    </div>
    <div class="modal_footer">
      <Button class="right" @click="openAuthModal">{{ l('ml_multiacc_add_account') }}</Button>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  import ModalHeader from './ModalHeader.vue';
  import Button from '../UI/Button.vue';

  export default {
    components: {
      ModalHeader,
      Button
    },

    computed: {
      ...mapState('users', ['users', 'activeUser'])
    },

    methods: {
      getUserDescription(user) {
        if(this.activeUser != user.id) return '@' + user.domain;
        else return this.l('ml_multiacc_active_account');
      },

      setAccount(id) {
        const prevUser = this.activeUser;
        if(prevUser == id) return;

        this.$store.commit('users/setActiveUser', id);

        if(prevUser) location.reload();
      },

      removeAccount(id) {
        this.$store.commit('users/removeUser', id);
      },

      openAuthModal() {
        this.$modals.open('auth');
      }
    }
  }
</script>

<style scoped>
  .modal_content { min-width: 300px }

  .item {
    display: flex;
    cursor: pointer;
    padding: 0 15px;
  }

  .item_photo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 10px 10px 10px 0;
  }

  .item_data {
    flex-grow: 1;
    padding: 10px 0;
  }

  .item:not(:last-child) .item_data {
    border-bottom: 1px solid var(--input-border);
  }

  .item_name_wrap {
    display: flex;
    margin-top: 4px;
  }

  .item_name { flex-grow: 1 }

  .item_description {
    color: var(--text-link);
    margin-top: 4px;
  }

  .item_close {
    margin: 3px 0 0 3px;
    width: 14px;
    height: 14px;
    opacity: .8;
    transition: opacity .3s;
  }

  .item_close:hover { opacity: 1 }
</style>
