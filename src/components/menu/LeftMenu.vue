<template>
  <div class="menu left">
    <div class="menu_photo">
      <img
        :src="userPhoto"
        class="menu_user_photo"
        @click="isUsersListActive = !isUsersListActive"
      >

      <div :class="['menu_users_list', { active: isUsersListActive }]" @mouseout="onMouseOut">
        <div
          v-for="user of usersList"
          :key="user.id"
          class="menu_user"
          @click="onClick(user.id)"
        >
          <img class="menu_user_photo" :src="getPhoto(user)">
          <div v-if="user.id === activeUserID" class="menu_user_active_icon">
            <Icon name="done_circle_mini" color="var(--icon-blue)" />
          </div>
          <div class="menu_user_name text-overflow segoe-ui">
            {{ user.first_name }} {{ user.last_name }}
          </div>
        </div>

        <div class="menu_user" @click="openModal('auth'), (isUsersListActive = false)">
          <div class="menu_user_photo add-profile">
            <Icon name="plus" color="var(--icon-blue)" />
          </div>
          <div class="menu_user_name text-overflow segoe-ui">
            {{ l('ml_multiacc_add_account') }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-for="{ route, active } of routes"
      :key="route"
      class="menu_icon"
      @click="openPage(`/${route}`)"
    >
      <Icon
        :name="`menu/${route}`"
        :color="active ? 'var(--icon-blue)' : 'var(--icon-gray)'"
        width="28"
        height="28"
      />
      <div v-if="counters[route]" class="menu_item_counter" :title="counters[route]">
        {{ convertCount(counters[route]) }}
      </div>
    </div>

    <div class="menu_grow"></div>

    <div class="menu_icon" @click="openModal('settings')">
      <Icon name="menu/settings" color="var(--icon-gray)" width="28" height="28" />
    </div>
  </div>
</template>

<script>
import { computed, ref, toRefs } from 'vue';
import { convertCount, getPhoto, moveArrItem, mouseOutWrapper } from 'js/utils';
import { openModal } from 'js/modals';
import { state, openPage, setAccount } from '.';
import store from 'js/store';

import Icon from '../UI/Icon.vue';

export default {
  components: {
    Icon
  },

  setup() {
    const isUsersListActive = ref(false);

    const onMouseOut = mouseOutWrapper(() => {
      isUsersListActive.value = false;
    });

    function onClick(user_id) {
      if (user_id === state.activeUserID) {
        isUsersListActive.value = false;
      } else {
        setAccount(user_id);
      }
    }

    return {
      ...toRefs(state),

      usersList: computed(() => {
        const usersList = Object.values(store.state.users.users);

        // Перемещаем активного пользователя в начало массива
        return moveArrItem(
          usersList,
          usersList.findIndex((user) => user.id === state.activeUserID),
          0
        );
      }),

      isUsersListActive,
      onMouseOut,
      onClick,

      convertCount,
      getPhoto,

      openModal,
      openPage
    };
  }
};
</script>

<style>
.menu.left {
  display: flex;
  flex-direction: column;
  flex: none;
  width: 60px;
  height: 100%;
  padding-top: 15px;
  border-right: 1px solid var(--separator);
}

.menu_icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 15px;
  cursor: pointer;
}

.menu_item_counter {
  position: absolute;
  top: -3px;
  left: 30px;
  font-size: 12px;
  background: var(--red-light);
  color: var(--background);
  border-radius: 10px;
  padding: 2px 5px 2px 4px;
  min-width: 18px;
  text-align: center;
}

.menu_grow {
  flex-grow: 1;
}

.menu_photo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  position: relative;
}

.menu_photo > img {
  cursor: pointer;
}

.menu_users_list {
  position: absolute;
  z-index: 2;
  background: var(--background);
  width: 250px;
  padding: 7px 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .15),
              0 1px 2px rgba(0, 0, 0, .15);
  border-radius: 8px;
  top: -12px;
  left: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s;
}

.menu_users_list.active {
  opacity: 1;
  pointer-events: all;
}

.menu_user {
  position: relative;
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color .2s;
}

.menu_user:not(:last-child) {
  margin-bottom: 4px;
}

.menu_user:hover {
  background: var(--messages-peer-active);
}

.menu_user_photo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex: none;
}

.menu_user_active_icon {
  position: absolute;
  left: 27px;
  bottom: 0;
  width: 18px;
  height: 18px;
  background: var(--background);
  border-radius: 50%;
  padding: 1px 0 0 1px;
}

.menu_user_name {
  margin-left: 10px;
}

.menu_user_photo.add-profile {
  padding: 4px;
}
</style>
