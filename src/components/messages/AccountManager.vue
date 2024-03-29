<template>
  <div class="account_manager">
    <img
      :src="userPhoto"
      class="account_photo"
      @click="isUsersListActive = !isUsersListActive"
    >

    <div :class="['account_users_list', { active: isUsersListActive }]" @mouseout="onMouseOut">
      <div
        v-for="user of usersList"
        :key="user.id"
        class="account_user"
        @click="onClick(user.id)"
      >
        <img class="account_photo" :src="getPhoto(user)">
        <div v-if="user.id === activeUserID" class="account_user_active_icon">
          <Icon name="done_circle_mini" color="var(--icon-blue)" />
        </div>
        <div class="account_user_name text-overflow">
          {{ user.first_name }} {{ user.last_name }}
        </div>
      </div>

      <div class="account_user add-profile" @click="openAuth">
        <div class="account_photo">
          <Icon name="plus" color="var(--icon-blue)" />
        </div>
        <div class="account_user_name text-overflow">
          {{ l('add_account') }}
        </div>
      </div>

      <div class="account_user remove-profile" @click="logout">
        <div class="account_photo">
          <Icon name="door_out" color="var(--icon-red)" class="-door_out" />
        </div>
        <div class="account_user_name text-overflow">
          {{ l('logout_account') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed, toRefs } from 'vue';
import { moveArrItem, mouseOutWrapper } from 'js/utils';
import { getPhoto } from 'js/api/utils';
import { usersStorage } from 'js/store/Storage';
import store from 'js/store';
import router from 'js/router';

import Icon from '@/UI/Icon.vue';

export default {
  components: {
    Icon
  },

  setup() {
    const state = reactive({
      activeUserID: computed(() => store.state.users.activeUserID),
      userPhoto: computed(() => getPhoto(store.getters['users/user'])),
      isUsersListActive: false,

      usersList: computed(() => {
        const usersList = Object.values(store.state.users.users);

        // Перемещаем активного пользователя в начало массива
        return moveArrItem(
          usersList,
          usersList.findIndex((user) => user.id === state.activeUserID),
          0
        );
      })
    });

    const onMouseOut = mouseOutWrapper(() => {
      state.isUsersListActive = false;
    });

    function setAccount(id) {
      if (state.activeUserID === id) {
        return;
      }

      usersStorage.update({
        ...usersStorage.data,
        activeUserID: id
      });

      window.location.reload();
    }

    function onClick(user_id) {
      if (user_id === state.activeUserID) {
        state.isUsersListActive = false;
      } else {
        setAccount(user_id);
      }
    }

    function openAuth() {
      state.isUsersListActive = false;
      router.push({
        path: '/auth',
        query: {
          onlyAddUser: 1
        }
      });
    }

    function logout() {
      store.dispatch('users/logout');
    }

    return {
      ...toRefs(state),

      onMouseOut,
      onClick,
      getPhoto,
      openAuth,
      logout
    };
  }
};
</script>

<style>
.account_manager {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.account_manager > img {
  cursor: pointer;
}

.account_photo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: none;
}

.account_users_list {
  position: absolute;
  z-index: 2;
  background: var(--background-accent);
  width: 250px;
  padding: 7px 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .15),
              0 1px 2px rgba(0, 0, 0, .15);
  border-radius: 8px;
  top: 3px;
  left: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s;
}

.account_users_list.active {
  opacity: 1;
  pointer-events: all;
}

.account_user {
  position: relative;
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color .2s;
}

.account_user:not(:last-child) {
  margin-bottom: 4px;
}

.account_user:hover {
  background: var(--messages-peer-active);
}

.account_user_active_icon {
  position: absolute;
  left: 27px;
  bottom: 0;
  width: 18px;
  height: 18px;
  background: var(--background-accent);
  border-radius: 50%;
  padding: 1px 0 0 1px;
}

.account_user_name {
  margin-left: 10px;
}

.account_user.add-profile .account_photo,
.account_user.remove-profile .account_photo {
  padding: 4px;
}

.account_user.add-profile .account_user_name {
  color: var(--text-light-blue);
}

.account_user.remove-profile .account_user_name {
  color: var(--red-dark);
}
</style>
