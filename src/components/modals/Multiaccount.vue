<template>
  <div class="modal">
    <ModalHeader>{{ l('ml_multiacc_header') }}</ModalHeader>
    <div class="modal_content">
      <div v-for="user in users" :key="user.id" class="item" @click="setAccount(user.id)">
        <img class="item_photo" :src="user.photo_100">
        <div class="item_data">
          <div class="item_name_wrap">
            <div class="item_name">{{ user.first_name }} {{ user.last_name }}</div>
            <Icon
              name="close"
              color="var(--icon-dark-gray)"
              class="item_close"
              @click.stop="removeAccount(user.id)"
            />
          </div>
          <div class="item_description">{{ getUserDescription(user) }}</div>
        </div>
      </div>
    </div>
    <div class="modal_footer">
      <Button class="right" @click="openModal('auth')">
        {{ l('ml_multiacc_add_account') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { openModal, closeModal } from 'js/modals';
import { usersStorage } from 'js/store/Storage';
import store from 'js/store';
import getTranslate from 'js/getTranslate';

import ModalHeader from './ModalHeader.vue';
import Button from '../UI/Button.vue';
import Icon from '../UI/Icon.vue';

export default {
  components: {
    ModalHeader,
    Button,
    Icon
  },

  setup() {
    const activeUser = computed(() => store.state.users.activeUser);
    const users = computed(() => store.state.users.users);

    function getUserDescription(user) {
      if (activeUser.value !== user.id) {
        return '@' + user.domain;
      }

      return getTranslate('ml_multiacc_active_account');
    }

    function setAccount(id) {
      if (activeUser.value === id) {
        return;
      }

      if (activeUser.value) {
        const usersData = { ...usersStorage.data };

        usersData.activeUser = id;
        usersStorage.update(usersData);

        window.location.reload();
      } else {
        closeModal('multiaccount');
        store.commit('users/setActiveUser', id);
      }
    }

    function removeAccount(id) {
      if (id === activeUser.value) {
        openModal('logout');
      } else {
        store.commit('users/removeUser', id);
      }
    }

    return {
      activeUser,
      users,

      getUserDescription,
      setAccount,
      removeAccount,
      openModal
    };
  }
};
</script>

<style scoped>
.modal_content {
  min-width: 300px;
}

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
  line-height: 18px;
}

.item:not(:last-child) .item_data {
  border-bottom: 1px solid var(--separator-dark);
}

.item_name_wrap {
  display: flex;
  margin-top: 4px;
}

.item_name {
  flex-grow: 1;
}

.item_description {
  color: var(--text-blue);
  margin-top: 4px;
}

.item_close {
  margin: 3px 0 0 3px;
  width: 14px;
  height: 14px;
  opacity: .8;
  transition: opacity .3s;
}

.item_close:hover {
  opacity: 1;
}
</style>
