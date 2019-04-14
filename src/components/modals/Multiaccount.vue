<template>
  <div class="modal">
    <ModalHeader>{{ l('modal_multiaccount_header') }}</ModalHeader>
    <div class="modal_content">
      <div class="item" v-for="user in users" @click="setAccount(user.id)" :key="user.id">
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
          <div class="item_description">{{ getUserDescription(user.id) }}</div>
        </div>
      </div>
    </div>
    <div class="modal_footer">
      <button class="button right" @click="openAuthModal">{{ l('modal_multiaccount_add_account') }}</button>
    </div>
  </div>
</template>

<script>
  import ModalHeader from './ModalHeader.vue';
  import { mapState } from 'vuex';
  import { resetAppState } from 'js/store/';

  export default {
    components: { ModalHeader },
    computed: {
      ...mapState('users', ['users', 'activeUser'])
    },
    methods: {
      getUserDescription(id) {
        if(this.activeUser != id) return `@id${id}`;
        else return this.l('modal_multiaccount_active_account');
      },
      setAccount(id) {
        if(this.activeUser == id) return;
        if(this.activeUser) resetAppState();
        this.$store.commit('users/setActiveUser', id);
      },
      removeAccount(id) {
        this.$store.commit('users/removeUser', id);
      },
      openAuthModal() {
        this.$modal.open('auth', { isModal: true });
      }
    }
  }
</script>

<style scoped>
  .modal_content { min-width: 300px }

  .item {
    display: flex;
    cursor: pointer;
    user-select: none;
    margin: 0 20px;
  }

  .item_photo {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 15px 10px 0 0;
  }

  .item_data {
    flex-grow: 1;
    padding: 15px 0;
    max-width: 200px;
  }

  .item:not(:last-child) .item_data {
    border-bottom: 1px solid #e7e8ec;
  }

  .item_name_wrap {
    display: flex;
    margin-top: 4px;
  }

  .item_name { flex-grow: 1 }

  .item_description {
    color: #3e70a9;
    margin-top: 4px;
  }

  .item_close {
    margin: 3px;
    width: 14px;
    height: 14px;
    opacity: .5;
    transition: opacity .3s;
  }

  .item_close:hover { opacity: .6 }
</style>
